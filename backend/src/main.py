# Início do seu código (sem alterações)
import os
import sys
from flask_admin import Admin, expose
from flask_admin.contrib.sqla import ModelView
from flask_login import LoginManager, current_user, UserMixin, login_required, logout_user, login_user
from flask import Flask, jsonify, request, send_from_directory, send_file, current_app, abort, redirect, url_for, flash, render_template
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from sqlalchemy import extract, and_, or_, func
from sqlalchemy.orm import joinedload
from PIL import Image, ExifTags # Adicionado ExifTags para a normalização de imagem
import uuid
from pydub import AudioSegment
from flask_babel import Babel
from flask_admin.base import AdminIndexView
from wtforms import PasswordField
import stripe
# Importação dupla de request e jsonify removida, já está acima
# from flask import request, jsonify


basedir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(os.path.dirname(basedir), 'templates')

app = Flask(__name__, template_folder=template_dir)

# --- Configurações do Flask-Mail ---
app.config['MAIL_SERVER'] = 'smtppro.zoho.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True           # Usar SSL, já que a porta é 465
app.config['MAIL_USE_TLS'] = False          # Deve ser False quando MAIL_USE_SSL é True
app.config['MAIL_USERNAME'] = 'contato@capsuladigital.com.br'
# Pega a senha da variável de ambiente que você configurou no wsgi.py
app.config['MAIL_PASSWORD'] = os.environ.get('ZOHO_MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'contato@capsuladigital.com.br' # O remetente padrão

# --- Configuração da Chave Secreta para Redefinição de Senha ---
# Pega a chave da variável de ambiente que você configurou no wsgi.py
app.config['SECRET_KEY_RESET_PASSWORD'] = os.environ.get('SECRET_KEY_RESET_PASSWORD')

# Inicializar o objeto Mail após configurar o app
mail = Mail(app)

# --- NOVA Variável de Ambiente para o E-MAIL DO RECEBEDOR ---
# Essa variável DEVE ser definida no PythonAnywhere, assim como ZOHO_MAIL_PASSWORD
EMAIL_RECEIVER = os.environ.get('EMAIL_RECEIVER_CAPSULA') # O e-mail para onde as mensagens do formulário irão

# Configurar o Serializer do itsdangerous
# O 'salt' ajuda a garantir que tokens gerados para diferentes propósitos
# ou com o mesmo valor (e.g., o mesmo email) não sejam idênticos.
app.config['SECRET_KEY_RESET_PASSWORD'] = os.environ.get('SECRET_KEY_RESET_PASSWORD', 'Rfocmn458#%dkc)dmvk21L30SdCCh6')
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY_RESET_PASSWORD'])


# ====================================================================================================
# FUNÇÃO DE NORMALIZAÇÃO DE ORIENTAÇÃO DE IMAGEM (ADICIONADA/AJUSTADA AQUI)
# ====================================================================================================

def normalize_image_orientation(image_path):
    """
    Normaliza a orientação de uma imagem com base em seus dados EXIF.
    Se uma imagem possui metadados EXIF de orientação, ela rotaciona os pixels da imagem
    para que a imagem seja exibida corretamente sem depender da tag EXIF,
    e então remove a tag de orientação.
    """
    try:
        img = Image.open(image_path)

        # Get EXIF data if available
        # Usando _getexif() para compatibilidade com o padrão comum, getexif() é o preferido para Pillow >= 9.0
        exif_data = img._getexif()
        
        if exif_data:
            # Encontrar o ID da tag 'Orientation'
            orientation_tag_id = None
            for key, value in ExifTags.TAGS.items():
                if value == 'Orientation':
                    orientation_tag_id = key
                    break

            orientation = exif_data.get(orientation_tag_id)

            # Aplicar rotação/espelhamento apropriado com base na orientação EXIF
            # O método .transpose() é eficiente para rotações de 90/180/270 e espelhamentos.
            # Ele ajusta as dimensões da imagem automaticamente.
            if orientation == 2:  # Flipped horizontally
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            elif orientation == 3:  # Rotated 180 degrees
                img = img.transpose(Image.ROTATE_180)
            elif orientation == 4:  # Flipped vertically
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
            elif orientation == 5:  # Transpose (rotate 90 counter-clockwise and flip vertically)
                img = img.transpose(Image.TRANSPOSE)
            elif orientation == 6:  # Rotated 90 degrees clockwise
                img = img.transpose(Image.ROTATE_270) # Equivalente a 90 graus anti-horário
            elif orientation == 7:  # Transverse (rotate 90 clockwise and flip vertically)
                img = img.transpose(Image.TRANSVERSE)
            elif orientation == 8:  # Rotated 270 degrees clockwise
                img = img.transpose(Image.ROTATE_90) # Equivalente a 270 graus anti-horário
            
            # Salva a imagem (sobrescrevendo a original) após a correção da orientação
            # A tag EXIF 'Orientation' será automaticamente removida ou corrigida pelo Pillow
            # ao salvar, já que os pixels foram fisicamente girados.
            img.save(image_path)
            print(f"DEBUG: Orientação da imagem corrigida e salva para: {image_path}")
        img.close() # Sempre fechar o manipulador do arquivo
    except (AttributeError, KeyError, IndexError, FileNotFoundError) as e:
        # Trata casos onde não há dados EXIF, a tag não é encontrada ou o arquivo não existe.
        print(f"DEBUG: Erro específico ou sem dados EXIF de orientação para {image_path}: {e}. Pulando normalização.")
    except Exception as e:
        print(f"ERRO: Erro geral durante a normalização da orientação da imagem para {image_path}: {e}")

# ====================================================================================================
# FIM DA FUNÇÃO DE NORMALIZAÇÃO DE ORIENTAÇÃO DE IMAGEM
# ====================================================================================================


# Função para gerar o token de redefinição
def generate_reset_token(user_email):
    """Gera um token seguro para redefinição de senha, válido por 1 hora."""
    return serializer.dumps(user_email, salt='password-reset-salt')

# Função para enviar o email de redefinição
def send_password_reset_email(user_email): # Passamos o email diretamente
    token = generate_reset_token(user_email)

    # Gera a URL completa para a rota de redefinição de senha
    # 'reset_password' será o nome da função da rota Flask que você criará
    reset_url = url_for('reset_password', token=token, _external=True)

    msg = Message("Redefinição de Senha - Capsula Digital",
                  recipients=[user_email])
    msg.body = f"""
    Olá!

    Você solicitou uma redefinição de senha para sua conta Capsula Digital.
    Para redefinir sua senha, clique no link abaixo:

    {reset_url}

    Este link é válido por 1 hora. Se você não solicitou isso, por favor, ignore este email.

    Atenciosamente,
    Equipe Capsula Digital
    """
    try:
        mail.send(msg)
        print(f"Email de redefinição enviado para {user_email}")
        return True
    except Exception as e:
        print(f"Erro ao enviar email de redefinição para {user_email}: {e}")
        return False

@app.route('/api/send-contact-email', methods=['POST'])
def send_contact_email():
    try:
        data = request.get_json()

        name = data.get('name')
        email_from_form = data.get('email') # Renomeado para evitar conflito com 'email' do Flask-Mail
        subject = data.get('subject')
        message = data.get('message')

        # Validação básica
        if not all([name, email_from_form, subject, message]):
            return jsonify({'message': 'Todos os campos são obrigatórios!'}), 400

        # Monta a mensagem do e-mail
        email_body = f"""
        <html>
        <body>
            <p><strong>Nome:</strong> {name}</p>
            <p><strong>E-mail de Contato:</strong> {email_from_form}</p>
            <p><strong>Assunto:</strong> {subject}</p>
            <hr>
            <p><strong>Mensagem:</strong></p>
            <p>{message}</p>
        </body>
        </html>
        """

        # Cria a mensagem usando Flask-Mail
        msg = Message(
            subject=f"Nova Mensagem de Contato (Capsula): {subject}",
            recipients=[EMAIL_RECEIVER], # O e-mail que receberá a mensagem
            html=email_body,
            sender=app.config['MAIL_DEFAULT_SENDER'] # Usa o remetente padrão configurado
        )

        # Envia o e-mail
        mail.send(msg)

        return jsonify({'message': 'Mensagem enviada com sucesso!'}), 200

    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}") # Loga o erro
        return jsonify({'message': 'Ocorreu um erro interno ao enviar a mensagem.'}), 500

# --- ROTAS DE AUTENTICAÇÃO E RECUPERAÇÃO DE SENHA ---

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password_api():
    """
    Endpoint de API para solicitar a redefinição de senha.
    Recebe um email via JSON do frontend (React).
    """
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email é obrigatório"}), 400

    # IMPORTANTE: Certifique-se de que o modelo 'User' e o objeto 'db'
    # estão definidos e acessíveis aqui (ex: from models import User, db)
    user = User.query.filter_by(email=email).first()

    if user:
        send_password_reset_email(user.email)
        message = 'Se um e-mail com este endereço for encontrado, um link de redefinição de senha será enviado.'
        return jsonify({"message": message}), 200
    else:
        # Segurança: sempre retorne a mesma mensagem para evitar enumeração de usuários
        message = 'Se um e-mail com este endereço for encontrado, um link de redefinição de senha será enviado.'
        return jsonify({"message": message}), 200


@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """
    Rota para redefinir a senha usando o token recebido por e-mail.
    Renderiza um formulário para GET e processa a nova senha para POST.
    """
    try:
        # Decodifica o token. Se inválido ou expirado, levantará uma exceção.
        # max_age define a validade do token em segundos (3600s = 1 hora)
        email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
    except Exception as e:
        # Se o token for inválido ou expirado, renderiza uma página de erro
        flash('O link de redefinição de senha é inválido ou expirou.', 'error')
        print(f"Erro ao decodificar token: {e}") # Para debug
        # Você precisará criar um templates/error_token.html simples para exibir esta mensagem
        return render_template('error_token.html', message='O link de redefinição de senha é inválido ou expirou.')

    # IMPORTANTE: Certifique-se de que o modelo 'User' e o objeto 'db'
    # estão definidos e acessíveis aqui.
    user = User.query.filter_by(email=email).first()

    if not user:
        # Se o usuário não for encontrado (e-mail do token não corresponde a um usuário)
        flash('Usuário não encontrado. O link de redefinição é inválido.', 'error')
        return render_template('error_token.html', message='Usuário não encontrado. O link de redefinição é inválido.')

    if request.method == 'POST':
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if not new_password or not confirm_password:
            flash('Por favor, preencha todos os campos.', 'error')
            return render_template('reset_password.html', token=token)

        if new_password != confirm_password:
            flash('As senhas não coincidem.', 'error')
            return render_template('reset_password.html', token=token)

        if len(new_password) < 6: # Exemplo de validação: senha mínima de 6 caracteres
            flash('A senha deve ter no mínimo 6 caracteres.', 'error')
            return render_template('reset_password.html', token=token)

        # Atualiza a senha do usuário
        user.set_password(new_password) # Assumindo que User.set_password faz o hash da senha
        db.session.commit() # Salva no banco de dados

        # 1. Defina a mensagem de sucesso
        success_message = 'Sua senha foi redefinida com sucesso! Você já pode fazer login com sua nova senha.'

        # 2. Renderize o template de sucesso, passando a mensagem
        return render_template('password_reset_success.html', message=success_message)

    # Para requisições GET (quando o usuário clica no link do e-mail), renderiza o formulário
    return render_template('reset_password.html', token=token)

    # --- Função Genérica para Enviar E-mails HTML ---
def send_html_email(recipient_email, subject, html_body):
    """
    Função genérica para enviar um e-mail com conteúdo HTML.
    Utiliza o objeto 'mail' do Flask-Mail já configurado.
    """
    msg = Message(subject, recipients=[recipient_email])
    msg.html = html_body # Use msg.html para enviar conteúdo HTML
    try:
        mail.send(msg)
        print(f"Email '{subject}' enviado para {recipient_email}")
        return True
    except Exception as e:
        print(f"Erro ao enviar email '{subject}' para {recipient_email}: {e}")
        return False

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
FRONTEND_DIST_PATH = os.path.join(PROJECT_ROOT, 'frontend', 'dist')
UPLOAD_DIR = os.path.join(SCRIPT_DIR, 'uploads')
STATIC_ROOT_PATH = os.path.join(PROJECT_ROOT, 'static')

print(f"🔥 MAIN.PY CARREGADO!")
print(f"🔥 PROJECT_ROOT: {PROJECT_ROOT}")
print(f"🔥 FRONTEND_DIST_PATH: {FRONTEND_DIST_PATH}")
print(f"🔥 UPLOAD_DIR: {UPLOAD_DIR}")

@app.before_request
def log_request_details():
    pass

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'PWqBHncjU%*djnN;.O?´sO0=_3Cslco(sjxi(J9s3')
DB_PATH = os.path.join(SCRIPT_DIR, 'capsula.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

app.config['BABEL_DEFAULT_LOCALE'] = 'pt_BR'
app.config['BABEL_DEFAULT_TIMEZONE'] = 'America/Sao_Paulo'

db = SQLAlchemy(app)
CORS(app)
login_manager = LoginManager(app)

# CORREÇÃO: Aponta para a NOVA rota de login que criaremos.
# Isso garante que qualquer acesso não autenticado ao admin seja redirecionado para nossa página de login.
login_manager.login_view = 'admin_login_view'
babel = Babel(app)

JWT_SECRET = os.environ.get('JWT_SECRET', 'capsula_jwt_secret_key_2024')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'ogg', 'mp4', 'mov', 'avi', 'mkv', 'webp', 'webm'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Seção de Modelos do Banco de Dados (sem alterações) ---
# ... (todo o seu código de modelos está aqui, inalterado) ...
capsule_tags = db.Table('capsule_tags',
    db.Column('capsule_id', db.Integer, db.ForeignKey('capsules.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    capsules = db.relationship('Capsule', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id, 'email': self.email, 'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_admin': self.is_admin
        }

    def __repr__(self):
        return f'<User {self.email}>'

class Mood(db.Model):
    __tablename__ = 'moods'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    emoji = db.Column(db.String(10), nullable=False)
    description = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    capsules = db.relationship(
        'Capsule',
        foreign_keys='Capsule.mood_id',
        backref='mood',
        lazy='dynamic'
    )

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'emoji': self.emoji,
            'description': self.description, 'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    capsules = db.relationship(
        'Capsule',
        secondary=capsule_tags,
        backref='tags',
        lazy='dynamic'
    )

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'description': self.description,
            'is_default': self.is_default, 'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserAdminView(ModelView):
    # Esta linha esconde o campo 'password_hash' do formulário de edição/criação
    form_excluded_columns = ('password_hash',)

    # Esta linha adiciona um novo campo chamado 'password' ao formulário,
    # que o usuário pode usar para definir uma nova senha.
    form_extra_fields = {
        'password': PasswordField('Nova Senha')
    }

    # Este método é chamado ANTES do modelo ser salvo (quando você clica em 'Salvar')
    def on_model_change(self, form, model, is_created):
        # Verifica se o usuário digitou algo no campo 'Nova Senha'
        if form.password.data:
            # Se digitou, faz o hash da senha e atribui ao campo 'password_hash' do modelo
            model.password_hash = generate_password_hash(form.password.data)

        # Chama o método original do ModelView para garantir que o resto do processamento aconteça
        super(UserAdminView, self).on_model_change(form, model, is_created)

class Capsule(db.Model):
    __tablename__ = 'capsules'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    mood_id = db.Column(db.Integer, db.ForeignKey('moods.id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    capsule_date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    media_files = db.relationship('MediaFile', backref='capsule', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        processed_location = self.location
        return {
            'id': self.id, 'user_id': self.user_id, 'mood_id': self.mood_id,
            'mood': self.mood.to_dict() if self.mood else None,
            'title': self.title,
            'description': self.description, 'capsule_date': self.capsule_date.isoformat() if self.capsule_date else None,
            'location': processed_location,
            'latitude': self.latitude, 'longitude': self.longitude,
            'is_private': self.is_private, 'created_at': self.created_at.isoformat() if self.created_at else None,
            'tags': [tag.to_dict() for tag in self.tags] if self.tags else [],
            'media_files': [media.to_dict() for media in self.media_files] if self.media_files else []
        }

class MediaFile(db.Model):
    __tablename__ = 'media_files'
    id = db.Column(db.Integer, primary_key=True)
    capsule_id = db.Column(db.Integer, db.ForeignKey('capsules.id'), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'capsule_id': self.capsule_id, 'original_filename': self.original_filename,
            'stored_filename': self.stored_filename, 'file_type': self.file_type, 'file_size': self.file_size,
            'mime_type': self.mime_type, 'created_at': self.created_at.isoformat() if self.created_at else None
        }

# --- Fim da Seção de Modelos ---


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# --- CORREÇÃO: ROTAS DE LOGIN E LOGOUT PARA O ADMIN ---
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login_view():
    # Se o usuário já está logado e é admin, redireciona para o painel
    if current_user.is_authenticated and current_user.is_admin:
        return redirect(url_for('admin.index'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()

        # Valida se o usuário existe, se a senha está correta e se ele é admin
        if user and user.check_password(password) and user.is_admin:
            login_user(user)  # Faz o login do usuário
            next_page = request.args.get('next')
            flash('Login realizado com sucesso!', 'success')
            return redirect(next_page or url_for('admin.index'))
        else:
            flash('Email, senha ou permissões inválidas.', 'danger')

    # Renderiza um template HTML para a página de login
    return render_template('admin/login.html')

@app.route('/admin/logout/')
@login_required
def admin_logout_view():
    logout_user()
    flash('Você foi desconectado.', 'success')
    return redirect(url_for('admin_login_view'))


# --- CONFIGURAÇÃO DE VIEWS DO FLASK-ADMIN (sem alterações na lógica de permissão) ---
class MyAdminIndexView(AdminIndexView):
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin

    def inaccessible_callback(self, name, **kwargs):
        # Redireciona para a nossa view de login customizada
        return redirect(url_for('admin_login_view', next=request.url))

class MyModelView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('admin_login_view', next=request.url))

# --- INICIALIZAÇÃO DO ADMIN (sem alterações) ---
admin = Admin(app, name='Capsula Admin', template_mode='bootstrap3', index_view=MyAdminIndexView())

admin.add_view(UserAdminView(User, db.session))
admin.add_view(MyModelView(Mood, db.session))
admin.add_view(MyModelView(Tag, db.session))
admin.add_view(MyModelView(Capsule, db.session))
admin.add_view(MyModelView(MediaFile, db.session))


# --- Restante do seu código (init_default_data, bloco with, decoradores, rotas da API, etc.) ---
# --- TOTALMENTE PRESERVADO E SEM ALTERAÇÕES ---
# ... (todo o resto do seu código, de init_default_data até o final, permanece aqui) ...

def init_default_data():
    """Inicializa dados padrão (humores e tags) se não existirem"""
    print("⏳ Verificando e inicializando dados padrão...")
    try:
        if Mood.query.count() == 0:
            default_moods = [
                {'name': 'Feliz', 'emoji': '😊', 'description': 'Sentindo-se alegre e positivo'},
                {'name': 'Triste', 'emoji': '😢', 'description': 'Sentindo-se melancólico ou desanimado'},
                {'name': 'Animado', 'emoji': '🤩', 'description': 'Cheio de energia e entusiasmo'},
                {'name': 'Relaxado', 'emoji': '😌', 'description': 'Calmo e tranquilo'},
                {'name': 'Ansioso', 'emoji': '😰', 'description': 'Preocupado ou nervoso'},
                {'name': 'Grato', 'emoji': '🙏', 'description': 'Sentindo gratidão'},
                {'name': 'Inspirado', 'emoji': '✨', 'description': 'Motivado e criativo'},
                {'name': 'Nostálgico', 'emoji': '🥺', 'description': 'Lembrando do passado com carinho'},
                {'name': 'Confiante', 'emoji': '💪', 'description': 'Seguro de si mesmo'},
                {'name': 'Apaixonado', 'emoji': '🥰', 'description': 'Sentindo amor intenso'},
                {'name': 'Pensativo', 'emoji': '🤔', 'description': 'Refletindo profundamente'},
                {'name': 'Surpreso', 'emoji': '😲', 'description': 'Impressionado ou espantado'},
                {'name': 'Orgulhoso', 'emoji': '🏆', 'description': 'Satisfeito com conquistas por mérito'},
                {'name': 'Curioso', 'emoji': '🔍', 'description': 'Interessado em descobrir'},
                {'name': 'Determinado', 'emoji': '🎯', 'description': 'Focado em objetivos e metas'},
                {'name': 'Sonhador', 'emoji': '🌙', 'description': 'Imaginando possibilidades'},
                {'name': 'Aventureiro', 'emoji': '🗺️', 'description': 'Pronto para explorar'},
                {'name': 'Pacífico', 'emoji': '☮️', 'description': 'Em harmonia interior'},
                {'name': 'Esperançoso', 'emoji': '🌅', 'description': 'Otimista sobre o futuro'},
                {'name': 'Contemplativo', 'emoji': '🧘', 'description': 'Em estado meditativo'},
                {'name': 'Radiante', 'emoji': '🌟', 'description': 'Brilhando de felicidade'},
                {'name': 'Sereno', 'emoji': '🕊️', 'description': 'Em paz profunda'},
                {'name': 'Nervoso', 'emoji': '😬', 'description': 'Sentindo nervosismo ou tensão'},
                {'name': 'Entediado', 'emoji': '🥱', 'description': 'Sentindo tédio ou falta de interesse'}
            ]
            for mood_data in default_moods:
                mood = Mood(**mood_data, is_default=True)
                db.session.add(mood)
            db.session.commit()
            print("✅ Humores padrão inicializados.")
        else:
            print("⏭️ Humores padrão já existem.")

        if Tag.query.count() == 0:
             default_tags = [
                {'name': 'Família', 'description': 'Momentos com família'}, {'name': 'Amigos', 'description': 'Tempo com amigos'},
                {'name': 'Trabalho', 'description': 'Experiências profissionais'}, {'name': 'Viagem', 'description': 'Aventuras e descobertas'},
                {'name': 'Dia Importante', 'description': 'Marcos significativos'}, {'name': 'Dia Marcante', 'description': 'Momentos inesquecíveis'},
                {'name': 'Conquista', 'description': 'Realizações pessoais'}, {'name': 'Reflexão', 'description': 'Pensamentos profundos'}
            ]
             for tag_data in default_tags:
                tag = Tag(**tag_data, is_default=True)
                db.session.add(tag)
             db.session.commit()
             print("✅ Tags padrão inicializadas.")
        else:
            print("⏭️ Tags padrão já existem.")

    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao inicializar dados padrão: {str(e)}")

with app.app_context():
    print("🛠️ Verificando e criando tabelas do banco de dados (executado ao carregar app)...")
    db.create_all()
    print("🛠️ Tabelas verificadas/criadas.")
    init_default_data()
    print("✅ Verificação e inicialização de dados padrão concluídas.")

    # MANTIDO: Criação do usuário admin padrão (admin@capsula.com / admin123)
    if User.query.filter_by(email='admin@capsula.com').first() is None:
        print("Criando usuário admin padrão...")
        admin_user = User(email='admin@capsula.com', name='Administrador', is_admin=True)
        admin_user.set_password('admin123') # MUDE ESTA SENHA EM PRODUÇÃO!
        db.session.add(admin_user)
        db.session.commit()
        print("✅ Usuário admin padrão criado: admin@capsula.com / admin123")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Formato do token inválido'}), 401
        if not token:
            return jsonify({'message': 'Token necessário'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id_from_token = data.get('user_id')
            if user_id_from_token is None:
                 return jsonify({'message': 'Payload do token inválido'}), 401

            current_user_from_token = db.session.get(User, user_id_from_token)

            if not current_user_from_token:
                return jsonify({'message': 'Usuário associado ao token não encontrado'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401
        except Exception as e:
             print(f"Erro inesperado na validação do token: {e}")
             return jsonify({'message': f'Erro interno na validação do token: {str(e)}'}), 500

        return f(current_user_from_token, *args, **kwargs)
    return decorated

MAX_IMAGE_DIMENSION = 800
JPEG_QUALITY = 85

def optimize_and_resize_image(image_path: str, max_dimension: int = MAX_IMAGE_DIMENSION, quality: int = JPEG_QUALITY):
    print(f"Attempting to optimize and resize image: {image_path}")
    img = None # Inicializa img como None para garantir que seja fechado no finally
    try:
        img = Image.open(image_path)
        original_width, original_height = img.size
        original_format = img.format

        print(f"Original dimensions: {original_width}x{original_height}, Format: {original_format}")

        largest_dimension = max(original_width, original_height)

        save_options = {}
        action_applied = False

        if largest_dimension > max_dimension:
            print(f"Image largest dimension ({largest_dimension}) exceeds max ({max_dimension}). Resizing needed.")
            ratio = max_dimension / largest_dimension
            new_width = int(original_width * ratio)
            new_height = int(original_height * ratio)

            if img.mode in ('RGBA', 'P') and original_format in ['JPEG', 'JPG']:
                 img = img.convert('RGB')
                 print("Converted image mode to RGB for processing.")

            try:
                 img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            except AttributeError:
                 img_resized = img.resize((new_width, new_height), Image.ANTIALIAS)
                 print("Using Image.ANTIALIAS for resizing (older Pillow version).")

            print(f"Resized to: {new_width}x{new_height}")
            img_to_save = img_resized

            if original_format in ['JPEG', 'JPG']:
                 save_options['quality'] = quality
                 save_options['optimize'] = True
                 print(f"Applying JPEG quality {quality} and optimization.")
            elif original_format == 'PNG':
                 save_options['optimize'] = True
                 print("Applying PNG optimization.")

            img_to_save.save(image_path, format=original_format, **save_options)
            action_applied = True
            print(f"Optimized and resized image saved to: {image_path}")

        else:
            print(f"Image dimensions ({original_width}x{original_height}) are within or equal to max_dimension ({max_dimension}). Checking for optimization.")
            should_optimize_only = False
            if original_format in ['JPEG', 'JPG', 'PNG']:
                 should_optimize_only = True
                 if original_format in ['JPEG', 'JPG']:
                      save_options['quality'] = quality
                      save_options['optimize'] = True
                      if img.mode in ('RGBA', 'P'):
                          img = img.convert('RGB')
                          print("Converted image mode to RGB for optimization-only save.")

                 elif original_format == 'PNG':
                      save_options['optimize'] = True

            if should_optimize_only:
                try:
                    img.save(image_path, format=original_format, **save_options)
                    action_applied = True
                    print(f"Image within limits re-saved with optimization to: {image_path}")
                except Exception as save_e:
                    print(f"Warning: Failed to re-save image within limits for optimization: {save_e}")
            else:
                 print("Image did not require resizing or further optimization.")

        return action_applied

    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path}")
        raise
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        raise
    finally:
        if img: # Garante que o objeto imagem seja fechado
            img.close()

# --- ROTAS DA API (totalmente preservadas) ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'message': 'Email, senha e nome são obrigatórios'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email já cadastrado'}), 400
        user = User(email=data['email'], name=data['name'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()

             # --- INÍCIO: Adicionar o envio do E-mail de Boas-Vindas ---
        destinatario = user.email
        nome_usuario = user.name # Usamos o nome do usuário recém-criado

        welcome_subject = "🎉 Bem-vindo(a) ao Capsula! Sua jornada de memórias começa agora!"
        welcome_html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
                .header {{ background-color: #f8f8f8; padding: 10px 20px; text-align: center; border-bottom: 1px solid #eee; }}
                .button {{ display: inline-block; padding: 10px 20px; margin: 15px 0; background-color: #6a0dad; color: white; text-decoration: none; border-radius: 5px; }}
                .footer {{ font-size: 0.9em; color: #777; text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Bem-vindo(a) ao Capsula!</h2>
                </div>
                <p>Olá {nome_usuario if nome_usuario else 'colega'},</p>
                <p>Seu cadastro foi realizado com sucesso! Estamos felizes em ter você conosco na Capsula.</p>
                <p>Para começar a guardar suas memórias e experiências, acesse sua área:</p>
                <p style="text-align: center;">
                    <a href="https://app.capsuladigital.com.br/login" class="button" target="_blank">Acessar Minha Capsula</a>
                </p>
                <p>Se tiver qualquer dúvida ou precisar de ajuda, nossa equipe está sempre à disposição.</p>
                <p>Atenciosamente,<br>A Equipe Capsula</p>
                <div class="footer">
                    <p><a href="https://www.capsuladigital.com.br/#faq" target="_blank">Perguntas Frequentes</a> | <a href="https://app.capsuladigital.com.br/contato" target="_blank">Contato</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        send_html_email(destinatario, welcome_subject, welcome_html_body)
        print(f"E-mail de boas-vindas enviado para {destinatario}")
        # --- FIM: Adicionar o envio do E-mail de Boas-Vindas ---

        token = jwt.encode({
            'user_id': user.id,
            'name': user.name,
            'email': user.email,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm='HS256')
        return jsonify({'message': 'Usuário criado com sucesso', 'token': token, 'user': user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro no registro: {str(e)}")
        return jsonify({'message': f'Erro interno ao registrar usuário: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email e senha são obrigatórios'}), 400
        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Email ou senha incorretos'}), 401
        token = jwt.encode({
            'user_id': user.id,
            'name': user.name,
            'email': user.email,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm='HS256')
        return jsonify({'message': 'Login realizado com sucesso', 'token': token, 'user': user.to_dict()}), 200
    except Exception as e:
        print(f"Erro no login: {str(e)}")
        return jsonify({'message': f'Erro interno ao realizar login: {str(e)}'}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user_from_token):
    try:
        return jsonify({'user': current_user_from_token.to_dict()}), 200
    except Exception as e:
        print(f"Erro ao buscar usuário /me: {str(e)}")
        return jsonify({'message': f'Erro ao buscar usuário: {str(e)}'}), 500

@app.route('/api/users/me', methods=['DELETE'])
@token_required
def delete_user_account(current_user_from_token):
    try:
        data = request.get_json()
        password_confirmation = data.get('password')

        if not password_confirmation:
            return jsonify({'message': 'É necessário fornecer a senha para confirmar a exclusão da conta'}), 400

        if not current_user_from_token.check_password(password_confirmation):
            return jsonify({'message': 'Senha incorreta. Não foi possível confirmar a exclusão da conta'}), 401

        # **IMPORTANTÍSSIMO:** Capture o email e o nome do usuário ANTES de deletá-lo do DB
        # O objeto current_user_from_token ainda tem esses dados neste ponto
        user_email_to_send = current_user_from_token.email
        user_name_to_send = current_user_from_token.name

        user_id = current_user_from_token.id

        all_user_media_files = MediaFile.query.join(Capsule).filter(Capsule.user_id == user_id).all()

        deleted_physical_count = 0
        physical_deletion_errors = 0
        for media_file in all_user_media_files:
            file_path = os.path.join(UPLOAD_DIR, media_file.stored_filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    deleted_physical_count += 1
                    print(f"Arquivo físico deletado: {file_path}")
                except Exception as file_e:
                    physical_deletion_errors += 1
                    print(f"Erro ao deletar arquivo físico {file_path}: {file_e}")
            else:
                print(f"Aviso: Arquivo físico não encontrado para {file_path} (registro no DB será removido).")

        db.session.delete(current_user_from_token)
        db.session.commit()

        print(f"Conta do usuário ID {user_id} e todos os dados associados (cápsulas, mídias) foram excluídos.")
        print(f"Arquivos físicos de mídia deletados: {deleted_physical_count}. Erros na exclusão física: {physical_deletion_errors}.")

        # --- INÍCIO: Adicionar o envio do E-mail de Exclusão de Conta ---
        delete_subject = "😢 Sua conta no Capsula foi excluída."
        delete_html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
                .header {{ background-color: #f8f8f8; padding: 10px 20px; text-align: center; border-bottom: 1px solid #eee; }}
                .button {{ display: inline-block; padding: 10px 20px; margin: 15px 0; background-color: #6a0dad; color: white; text-decoration: none; border-radius: 5px; }}
                .footer {{ font-size: 0.9em; color: #777; text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Confirmação de Exclusão de Conta</h2>
                </div>
                <p>Olá {user_name_to_send if user_name_to_send else 'colega'},</p>
                <p>Confirmamos que sua conta no Cápsula, associada ao e-mail <strong>{user_email_to_send}</strong>, foi excluída com sucesso.</p>
                <p>Agradecemos sinceramente pelo tempo que você passou conosco e por ter guardado suas memórias no Cápsula.</p>
                <p>Lembre-se: as memórias são tesouros únicos e muitas vezes insubstituíveis. **Pode ser que, no futuro, você sinta falta de ter esses momentos preciosos guardados para relembrar.**</p>
                <p>Sua opinião é muito importante para nós. Se puder, por favor, nos diga o motivo da sua saída para que possamos continuar melhorando:</p>
                <p style="text-align: center;">
                    <a href="https://capsula-wilder.pythonanywhere.com/contato" class="button" >Deixar Feedback</a>
                </p>
                <p>Se você mudar de ideia no futuro, estaremos de portas abertas para recebê-lo(a) novamente.</p>
                <p>Atenciosamente,<br>A Equipe Capsula</p>
                <div class="footer">
                    <p><a href="https://capsula-wilder.pythonanywhere.com/contato" target="_blank">Contato</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        send_html_email(user_email_to_send, delete_subject, delete_html_body)
        print(f"E-mail de exclusão de conta enviado para {user_email_to_send}")
        # --- FIM: Adicionar o envio do E-mail de Exclusão de Conta ---

        return jsonify({'message': 'Conta excluída com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao excluir conta do usuário: {str(e)}")
        return jsonify({'message': f'Erro interno ao excluir conta: {str(e)}'}), 500

@app.route('/api/users/password', methods=['PUT'])
@token_required
def update_user_password(current_user_from_token):
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_new_password = data.get('confirm_new_password')

        if not current_password or not new_password or not confirm_new_password:
            return jsonify({'message': 'Todos os campos são obrigatórios: senha atual, nova senha e confirmação da nova senha'}), 400

        if not current_user_from_token.check_password(current_password):
            return jsonify({'message': 'Senha atual incorreta'}), 401

        if new_password != confirm_new_password:
            return jsonify({'message': 'Nova senha e confirmação não correspondem'}), 400

        if len(new_password) < 6:
            return jsonify({'message': 'A nova senha deve ter pelo menos 6 caracteres'}), 400

        current_user_from_token.set_password(new_password)
        db.session.commit()
        return jsonify({'message': 'Senha atualizada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar senha do usuário {current_user_from_token.id}: {str(e)}")
        return jsonify({'message': f'Erro interno ao atualizar senha: {str(e)}'}), 500

@app.route('/api/users/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user_from_token):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Dados de atualização não fornecidos'}), 400

        if 'name' in data:
            if not data['name']:
                return jsonify({'message': 'Nome não pode ser vazio'}), 400
            current_user_from_token.name = data['name']

        if 'email' in data:
            new_email = data['email']
            if not new_email:
                return jsonify({'message': 'Email não pode ser vazio'}), 400
            if '@' not in new_email or '.' not in new_email:
                return jsonify({'message': 'Formato de email inválido'}), 400

            existing_user = User.query.filter(User.email == new_email, User.id != current_user_from_token.id).first()
            if existing_user:
                return jsonify({'message': 'Este email já está cadastrado por outro usuário'}), 409

            current_user_from_token.email = new_email

        db.session.commit()
        return jsonify({'message': 'Perfil atualizado com sucesso', 'user': current_user_from_token.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar perfil do usuário {current_user_from_token.id}: {str(e)}")
        return jsonify({'message': f'Erro interno ao atualizar perfil: {str(e)}'}), 500

@app.route('/api/tags', methods=['GET'])
@token_required
def get_tags(current_user_from_token):
    try:
        tags = Tag.query.all()
        return jsonify({'tags': [tag.to_dict() for tag in tags]}), 200
    except Exception as e:
        print(f"Erro ao buscar tags: {str(e)}")
        return jsonify({'message': f'Erro ao buscar tags: {str(e)}'}), 500

@app.route('/api/moods', methods=['GET'])
@token_required
def get_moods(current_user_from_token):
    try:
        moods = Mood.query.all()
        return jsonify({'moods': [mood.to_dict() for mood in moods]}), 200
    except Exception as e:
        print(f"Erro ao buscar humores: {str(e)}")
        return jsonify({'message': f'Erro ao buscar humores: {str(e)}'}), 500

@app.route('/api/capsules', methods=['GET'])
@token_required
def get_capsules(current_user_from_token):
    try:
        search = request.args.get('search', '')
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)

        mood_id = request.args.get('mood_id', type=int)
        tag_id = request.args.get('tag_id', type=int)

        query = Capsule.query.filter_by(user_id=current_user_from_token.id)

        if search:
            query = query.join(Capsule.tags).filter(
                or_(
                    Capsule.title.ilike(f'%{search}%'),
                    Capsule.description.ilike(f'%{search}%'),
                    Capsule.location.ilike(f'%{search}%'),
                    Tag.name.ilike(f'%{search}%')
                )
            ).distinct()

        if mood_id is not None:
            query = query.filter(Capsule.mood_id == mood_id)

        if tag_id is not None:
            query = query.filter(Capsule.tags.any(Tag.id == tag_id))

        if year is not None:
            query = query.filter(extract('year', Capsule.capsule_date) == year)
        if month is not None:
            query = query.filter(extract('month', Capsule.capsule_date) == month)

        capsules = query.order_by(Capsule.capsule_date.desc()).all()

        return jsonify([capsule.to_dict() for capsule in capsules]), 200
    except ValueError:
         return jsonify({'message': 'Parâmetros de ano, mês, humor ou tag inválidos'}), 400
    except Exception as e:
        print(f"Erro ao buscar cápsulas: {str(e)}")
        return jsonify({'message': f'Erro interno ao buscar cápsulas: {str(e)}'}), 500

@app.route('/api/capsules', methods=['POST'])
@token_required
def create_capsule(current_user_from_token):
    try:
        data = request.get_json()
        title = data.get('title')
        mood_id = data.get('mood_id')
        description = data.get('description', '')
        capsule_date_str = data.get('capsule_date')
        location = data.get('location')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        is_private = data.get('is_private', False)
        tag_ids = data.get('tag_ids', [])

        if not title:
            return jsonify({'message': 'Título é obrigatório'}), 400
        if not mood_id:
            return jsonify({'message': 'Humor é obrigatório'}), 400

        mood = Mood.query.get(mood_id)
        if not mood:
            return jsonify({'message': 'Humor não encontrado'}), 400

        capsule_date = datetime.now()
        if capsule_date_str:
            try:
                capsule_date = datetime.fromisoformat(capsule_date_str)
            except ValueError:
                return jsonify({'message': 'Formato de data inválido para capsule_date'}), 400

        capsule = Capsule(
            user_id=current_user_from_token.id,
            mood_id=mood_id,
            title=title,
            description=description,
            capsule_date=capsule_date,
            location=location,
            latitude=latitude,
            longitude=longitude,
            is_private=is_private
        )

        db.session.add(capsule)
        db.session.flush()

        if tag_ids:
            tags = Tag.query.filter(Tag.id.in_(tag_ids)).all()
            if len(tags) != len(tag_ids):
                 found_ids = {tag.id for tag in tags}
                 missing_ids = [tid for tid in tag_ids if tid not in found_ids]
                 db.session.rollback()
                 return jsonify({'message': f'Alguns tags não foram encontradas. IDs inválidos: {missing_ids}'}), 400
            capsule.tags.extend(tags)

        db.session.commit()
        return jsonify({'message': 'Cápsula criada com sucesso', 'capsule': capsule.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar cápsula: {str(e)}")
        return jsonify({'message': f'Erro interno ao criar cápsula: {str(e)}'}), 500

@app.route('/api/capsules/<int:capsule_id>', methods=['GET'])
@token_required
def get_capsule(current_user_from_token, capsule_id):
    try:
        capsule = Capsule.query.options(joinedload(Capsule.mood), joinedload(Capsule.tags)).filter_by(id=capsule_id, user_id=current_user_from_token.id).first()
        if not capsule:
            return jsonify({'message': 'Cápsula não encontrada ou você não tem permissão para visualizá-la'}), 404
        return jsonify({'capsule': capsule.to_dict()}), 200
    except Exception as e:
        print(f"Erro ao buscar cápsula {capsule_id}: {str(e)}")
        return jsonify({'message': f'Erro ao buscar cápsula: {str(e)}'}), 500

@app.route('/api/capsules/<int:capsule_id>', methods=['DELETE'])
@token_required
def delete_capsule(current_user_from_token, capsule_id):
    try:
        capsule = Capsule.query.filter_by(id=capsule_id, user_id=current_user_from_token.id).first()
        if not capsule:
            return jsonify({'message': 'Cápsula não encontrada ou você não tem permissão para excluí-la'}), 404

        deleted_count = 0
        error_count = 0
        media_files_to_delete = MediaFile.query.filter_by(capsule_id=capsule_id).all()
        print(f"Found {len(media_files_to_delete)} media files associated with capsule {capsule_id} for deletion.")

        for media_file in media_files_to_delete:
             file_path_to_delete = os.path.join(UPLOAD_DIR, media_file.stored_filename)
             if os.path.exists(file_path_to_delete):
                 try:
                     os.remove(file_path_to_delete)
                     print(f"Deleted physical media file: {file_path_to_delete}")
                     deleted_count += 1
                 except Exception as file_e:
                     print(f"Erro ao deletar arquivo físico {file_path_to_delete}: {file_e}")
                     error_count += 1
             else:
                 print(f"Aviso: Arquivo físico não encontrado para {file_path_to_delete} (registro no DB será removido).")

        db.session.delete(capsule)
        db.session.commit()
        print(f"Cápsula ID {capsule_id} record deleted from database.")

        print(f"Capsule ID {capsule_id} deleted. Physical media files deleted: {deleted_count}. Errors deleting physical media files: {error_count}")

        return jsonify({
            'message': 'Cápsula excluída com sucesso',
            'media_files_deleted_physical': deleted_count,
            'media_files_delete_physical_errors': error_count
            }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao excluir cápsula {capsule_id}: {str(e)}")
        return jsonify({'message': f'Erro ao excluir cápsula: {str(e)}'}), 500

@app.route('/api/capsules/<int:capsule_id>', methods=['PUT'])
@token_required
def update_capsule(current_user_from_token, capsule_id):
    try:
        data = request.get_json()
        capsule = Capsule.query.filter_by(id=capsule_id, user_id=current_user_from_token.id).first()
        if not capsule:
            return jsonify({'message': 'Cápsula não encontrada ou você não tem permissão para editá-la'}), 404

        if 'title' in data:
            capsule.title = data['title']
        if 'description' in data:
            capsule.description = data['description']
        if 'mood_id' in data:
             if data['mood_id'] is None:
                 capsule.mood_id = None
             else:
                 mood = Mood.query.get(data['mood_id'])
                 if not mood:
                     return jsonify({'message': 'Humor não encontrado'}), 400
                 capsule.mood_id = data['mood_id']
        if 'capsule_date' in data:
            try:
                if data['capsule_date']:
                    capsule.capsule_date = datetime.fromisoformat(data['capsule_date'])
                else:
                     return jsonify({'message': 'Data da cápsula não pode ser vazia'}), 400
            except ValueError:
                return jsonify({'message': 'Formato de data inválido para capsule_date'}), 400
        if 'location' in data:
            capsule.location = data['location'] if data['location'] is not None else None
        if 'latitude' in data:
             capsule.latitude = data['latitude'] if data['latitude'] is not None else None
        if 'longitude' in data:
             capsule.longitude = data['longitude'] if data['longitude'] is not None else None
        if 'is_private' in data:
            if isinstance(data['is_private'], bool):
                 capsule.is_private = data['is_private']
            else:
                 print(f"WARNING: 'is_private' enviado com tipo inesperado: {type(data['is_private'])}")

        if 'tag_ids' in data:
            capsule.tags.clear()
            if data['tag_ids'] is not None and isinstance(data['tag_ids'], list) and len(data['tag_ids']) > 0:
                new_tags = Tag.query.filter(Tag.id.in_(data['tag_ids'])).all()
                if len(new_tags) != len(data['tag_ids']):
                    found_ids = {tag.id for tag in new_tags}
                    missing_ids = [tid for tid in data['tag_ids'] if tid not in found_ids]
                    return jsonify({'message': f'Alguns tags solicitadas não foram encontradas. IDs inválidos: {missing_ids}'}), 400
                capsule.tags.extend(new_tags)
            elif data['tag_ids'] is not None:
                 print(f"WARNING: 'tag_ids' enviado em formato inesperado na atualização: {data['tag_ids']}")

        db.session.commit()
        return jsonify({'message': 'Cápsula atualizada com sucesso', 'capsule': capsule.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar cápsula {capsule_id}: {str(e)}")
        return jsonify({'message': f'Erro ao atualizar cápsula: {str(e)}'}), 500

@app.route('/api/capsules/<int:capsule_id>/media', methods=['GET'])
@token_required
def get_capsule_media(current_user_from_token, capsule_id):
    try:
        capsule = Capsule.query.filter_by(id=capsule_id, user_id=current_user_from_token.id).first()
        if not capsule:
            return jsonify({'message': 'Cápsula não encontrada ou você não tem permissão'}), 404
        return jsonify({'media_files': [media.to_dict() for media in capsule.media_files]}), 200
    except Exception as e:
        print(f"Erro ao buscar mídia da cápsula {capsule_id}: {str(e)}")
        return jsonify({'message': f'Erro ao buscar mídia da cápsula: {str(e)}'}), 500

@app.route('/api/capsules/stats', methods=['GET'])
@token_required
def get_capsules_stats(current_user_from_token):
    try:
        total_capsules = Capsule.query.filter_by(user_id=current_user_from_token.id).count()
        current_utc = datetime.utcnow()
        current_month = current_utc.month
        current_year = current_utc.year

        this_month_capsules = Capsule.query.filter(
            and_(
                Capsule.user_id == current_user_from_token.id,
                extract('year', Capsule.capsule_date) == current_year,
                extract('month', Capsule.capsule_date) == current_month
            )
        ).count()

        this_year_capsules = Capsule.query.filter(
            and_(
                Capsule.user_id == current_user_from_token.id,
                extract('year', Capsule.capsule_date) == current_year
            )
        ).count()

        return jsonify({
            'total_capsules': total_capsules,
            'this_month': this_month_capsules,
            'this_year': this_year_capsules
            }), 200
    except Exception as e:
        print(f"Erro ao buscar estatísticas de cápsulas: {str(e)}")
        return jsonify({'message': f'Erro ao buscar estatísticas: {str(e)}'}), 500

@app.route('/api/analytics', methods=['GET'])
@token_required
def get_user_analytics(current_user_from_token):
    try:
        total_capsules = Capsule.query.filter_by(user_id=current_user_from_token.id).count()

        mood_counts_query = db.session.query(
            Mood.name,
            Mood.emoji,
            func.count(Capsule.id)
        ).join(Mood.capsules).filter(Capsule.user_id == current_user_from_token.id).group_by(Mood.name, Mood.emoji).all()

        mood_distribution = []
        for name, emoji, count in mood_counts_query:
            mood_distribution.append({
                'mood_name': name,
                'emoji': emoji,
                'count': count,
                'percentage': (count / total_capsules * 100) if total_capsules > 0 else 0
            })
        mood_distribution.sort(key=lambda x: x['count'], reverse=True)

        tag_counts_query = db.session.query(
            Tag.name,
            func.count(Capsule.id)
        ).join(Tag.capsules).filter(Capsule.user_id == current_user_from_token.id).group_by(Tag.name).all()

        tag_distribution = []
        for name, count in tag_counts_query:
            tag_distribution.append({
                'tag_name': name,
                'count': count,
                'percentage': (count / total_capsules * 100) if total_capsules > 0 else 0
            })
        tag_distribution.sort(key=lambda x: x['count'], reverse=True)

        temporal_evolution = {
            'labels': [],
            'capsules_per_month': [],
            'moods_per_month': {},
            'tags_per_month': {}
        }

        today = datetime.utcnow()

        month_keys_ordered = []
        labels_ordered = []

        for i in range(6):
            target_month = today.month - (5 - i)
            target_year = today.year
            while target_month <= 0:
                target_month += 12
                target_year -= 1

            month_date = datetime(target_year, target_month, 1)
            month_keys_ordered.append(month_date.strftime('%Y-%m'))
            labels_ordered.append(month_date.strftime('%b %Y'))

        temporal_evolution['labels'] = labels_ordered

        earliest_month_year_str = month_keys_ordered[0]
        start_query_year = int(earliest_month_year_str.split('-')[0])
        start_query_month = int(earliest_month_year_str.split('-')[1])
        start_query_date = datetime(start_query_year, start_query_month, 1)

        capsules_monthly_query = db.session.query(
            func.strftime('%Y-%m', Capsule.capsule_date).label('month_year'),
            func.count(Capsule.id)
        ).filter(
            Capsule.user_id == current_user_from_token.id,
            Capsule.capsule_date >= start_query_date
        ).group_by('month_year').order_by('month_year').all()

        capsules_monthly_data = {month_year: count for month_year, count in capsules_monthly_query}
        temporal_evolution['capsules_per_month'] = [capsules_monthly_data.get(mk, 0) for mk in month_keys_ordered]

        moods_monthly_query = db.session.query(
            Mood.name,
            func.strftime('%Y-%m', Capsule.capsule_date).label('month_year'),
            func.count(Capsule.id)
        ).join(Mood.capsules).filter(
            Capsule.user_id == current_user_from_token.id,
            Capsule.capsule_date >= start_query_date
        ).group_by(Mood.name, 'month_year').order_by(Mood.name, 'month_year').all()

        all_mood_names = [m.name for m in Mood.query.all()]
        for mood_name in all_mood_names:
            temporal_evolution['moods_per_month'][mood_name] = [0] * len(month_keys_ordered)

        for mood_name, month_year, count in moods_monthly_query:
            if mood_name in temporal_evolution['moods_per_month']:
                try:
                    month_index = month_keys_ordered.index(month_year)
                    temporal_evolution['moods_per_month'][mood_name][month_index] = count
                except ValueError:
                    pass

        tags_monthly_query = db.session.query(
            Tag.name,
            func.strftime('%Y-%m', Capsule.capsule_date).label('month_year'),
            func.count(Capsule.id)
        ).join(Tag.capsules).filter(
            Capsule.user_id == current_user_from_token.id,
            Capsule.capsule_date >= start_query_date
        ).group_by(Tag.name, 'month_year').order_by(Tag.name, 'month_year').all()

        all_tag_names = [t.name for t in Tag.query.all()]
        for tag_name in all_tag_names:
            temporal_evolution['tags_per_month'][tag_name] = [0] * len(month_keys_ordered)

        for tag_name, month_year, count in tags_monthly_query:
            if tag_name in temporal_evolution['tags_per_month']:
                try:
                    month_index = month_keys_ordered.index(month_year)
                    temporal_evolution['tags_per_month'][tag_name][month_index] = count
                except ValueError:
                    pass

        unique_moods_used = db.session.query(func.count(db.distinct(Capsule.mood_id))). \
            filter(Capsule.user_id == current_user_from_token.id, Capsule.mood_id.isnot(None)).scalar()

        unique_tags_used = db.session.query(func.count(db.distinct(Tag.id))). \
            join(Capsule.tags). \
            filter(Capsule.user_id == current_user_from_token.id).scalar()

        total_available_moods = Mood.query.count()
        total_available_tags = Tag.query.count()

        all_user_capsules_with_tags = Capsule.query.filter_by(user_id=current_user_from_token.id).options(joinedload(Capsule.tags)).all()

        co_occurrence_matrix = {}
        for capsule in all_user_capsules_with_tags:
            capsule_tags_names = sorted([t.name for t in capsule.tags])

            for i in range(len(capsule_tags_names)):
                for j in range(i + 1, len(capsule_tags_names)):
                    tag1 = capsule_tags_names[i]
                    tag2 = capsule_tags_names[j]
                    pair = tuple(sorted((tag1, tag2)))
                    co_occurrence_matrix[pair] = co_occurrence_matrix.get(pair, 0) + 1

        tag_correlations = []
        for (tag1, tag2), count in co_occurrence_matrix.items():
            tag_correlations.append({
                'tag1': tag1,
                'tag2': tag2,
                'co_occurrence_count': count
            })
        tag_correlations.sort(key=lambda x: x['co_occurrence_count'], reverse=True)


        return jsonify({
            'overall_stats': {
                'total_capsules': total_capsules,
                'unique_moods_used': unique_moods_used,
                'unique_tags_used': unique_tags_used,
                'total_available_moods': total_available_moods,
                'total_available_tags': total_available_tags
            },
            'mood_distribution': mood_distribution,
            'tag_distribution': tag_distribution,
            'temporal_evolution': temporal_evolution,
            'tag_correlations': tag_correlations
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao gerar analytics para o usuário {current_user_from_token.id}: {str(e)}")
        return jsonify({'message': f'Erro interno ao gerar analytics: {str(e)}'}), 500

@app.route('/api/media/upload', methods=['POST'])
@token_required
def upload_media(current_user_from_token):
    file_paths_to_cleanup_on_error = []
    try:
        print("DEBUG_UPLOAD: Entrando na função upload_media.")
        print(f"DEBUG_UPLOAD: Headers da requisição: {request.headers}")
        print(f"DEBUG_UPLOAD: Content-Type da requisição: {request.headers.get('Content-Type')}")
        print(f"DEBUG_UPLOAD: Conteúdo de request.files: {request.files}")
        print(f"DEBUG_UPLOAD: Conteúdo de request.form: {request.form}")

        if 'files' not in request.files:
            if 'file' in request.files:
                files_to_process = [request.files['file']]
            else:
                print("DEBUG_UPLOAD: Nem 'files' nem 'file' encontrados em request.files. Retornando erro 400.")
                return jsonify({'message': 'Nenhum arquivo enviado (esperava "files" ou "file")'}), 400
        else:
            files_to_process = request.files.getlist('files')
            print(f"DEBUG_UPLOAD: 'files' encontrado em request.files. Quantidade: {len(files_to_process)}")

        capsule_id = request.form.get('capsule_id')
        print(f"DEBUG_UPLOAD: capsule_id recebido: {capsule_id}")
        if not capsule_id:
            print("DEBUG_UPLOAD: capsule_id faltando nos dados do formulário.")
            return jsonify({'message': 'ID da cápsula é obrigatório no form data'}), 400

        try:
            capsule_id_int = int(capsule_id)
        except ValueError:
            return jsonify({'message': 'ID da cápsula inválido'}), 400

        capsule = Capsule.query.filter_by(id=capsule_id_int, user_id=current_user_from_token.id).first()
        if not capsule:
            abort(404, description="Cápsula não encontrada ou você não tem permissão.")

        uploaded_media_files = []
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
            print(f"Diretório de uploads criado: {UPLOAD_DIR}")

        for file in files_to_process:
            if file.filename == '':
                print("WARNING: Arquivo com nome vazio ignorado.")
                continue

            if not allowed_file(file.filename):
                print(f"WARNING: Arquivo com extensão não permitida ignorado: {file.filename}")
                continue

            mime_type = file.mimetype if hasattr(file, 'mimetype') else file.content_type
            file_type = 'unknown'
            if mime_type and mime_type.startswith('image/'): file_type = 'image'
            elif mime_type and mime_type.startswith('audio/'): file_type = 'audio'
            elif mime_type and mime_type.startswith('video/'): file_type = 'video'

            original_filename_base, file_extension_with_dot = os.path.splitext(file.filename)
            file_extension = file_extension_with_dot[1:].lower() if file_extension_with_dot else ''

            temp_stored_filename = f"{uuid.uuid4()}.{file_extension}"
            temp_file_path = os.path.join(UPLOAD_DIR, temp_stored_filename)

            try:
                file.save(temp_file_path)
                print(f"File initially saved to: {temp_file_path}")
            except Exception as e:
                print(f"Error saving file to {temp_file_path}: {e}")
                db.session.rollback()
                for p in file_paths_to_cleanup_on_error:
                    if os.path.exists(p):
                        try: os.remove(p)
                        except Exception as cleanup_e: print(f"Error cleaning up file {p}: {cleanup_e}")
                return jsonify({'message': f'Erro interno do servidor (salvar arquivo {file.filename}): {str(e)}'}), 500

            final_file_path_on_disk = temp_file_path
            final_mime_type_for_db = mime_type
            final_stored_filename_in_db = temp_stored_filename

            if file_type == 'audio' and file_extension == 'webm':
                print(f"Detected WebM audio file: {temp_stored_filename}. Attempting conversion to MP3.")
                try:
                    audio = AudioSegment.from_file(temp_file_path, format="webm")

                    mp3_filename = f"{uuid.uuid4()}.mp3"
                    mp3_file_path = os.path.join(UPLOAD_DIR, mp3_filename)

                    audio.export(mp3_file_path, format="mp3")

                    os.remove(temp_file_path)
                    print(f"Successfully converted {temp_stored_filename} to MP3 ({mp3_filename}) and removed original WebM.")

                    final_file_path_on_disk = mp3_file_path
                    final_mime_type_for_db = 'audio/mpeg'
                    final_stored_filename_in_db = mp3_filename

                except Exception as e:
                    print(f"WARNING: Failed to convert WebM audio {temp_stored_filename} to MP3: {e}. Keeping original WebM.")

            file_paths_to_cleanup_on_error.append(final_file_path_on_disk)

            file_size_initial = os.path.getsize(final_file_path_on_disk)
            file_size_final = file_size_initial

            if file_type == 'image':
                try:
                    # ====================================================================================
                    # CHAMADA À FUNÇÃO DE NORMALIZAÇÃO DE ORIENTAÇÃO - INSERIDA AQUI
                    # ====================================================================================
                    print(f"DEBUG: Chamando normalize_image_orientation para {final_file_path_on_disk}")
                    normalize_image_orientation(final_file_path_on_disk)
                    # ====================================================================================
                    # FIM DA CHAMADA
                    # ====================================================================================

                    print("Calling optimize_and_resize_image for an image file.")
                    optimization_applied = optimize_and_resize_image(final_file_path_on_disk, max_dimension=MAX_IMAGE_DIMENSION, quality=JPEG_QUALITY)
                    file_size_final = os.path.getsize(final_file_path_on_disk)
                    if optimization_applied:
                        print(f"Image optimization and resize applied successfully. Final size: {file_size_final} bytes")
                    else:
                        print(f"Image did not require resizing, but optimization might have been applied. Final size: {file_size_final} bytes")

                except Exception as e:
                    print(f"WARNING: Image optimization failed for {final_stored_filename_in_db}: {e}. Using original file.")
            else:
                print(f"File type is {file_type}. Skipping image optimization.")

            media_file = MediaFile(
                capsule_id=capsule.id,
                original_filename=file.filename,
                stored_filename=final_stored_filename_in_db,
                file_type=file_type,
                file_size=file_size_final,
                mime_type=final_mime_type_for_db,
                created_at=datetime.utcnow()
            )
            db.session.add(media_file)
            uploaded_media_files.append(media_file.to_dict())

        db.session.commit()
        return jsonify({'message': 'Arquivos enviados e processados com sucesso', 'media_files': uploaded_media_files}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro geral no upload: {str(e)}")
        for p in file_paths_to_cleanup_on_error:
            if os.path.exists(p):
                try:
                    os.remove(p)
                    print(f"Cleaned up partially uploaded file: {p}")
                except Exception as cleanup_e:
                    print(f"Error cleaning up file {p}: {cleanup_e}")
        return jsonify({'message': f'Erro interno ao enviar arquivos: {str(e)}'}), 500


@app.route('/api/media/<int:media_id>', methods=['GET'])
@token_required
def get_media(current_user_from_token, media_id):
    try:
        media_file = MediaFile.query.get(media_id)
        if not media_file:
            abort(404, description="Arquivo de mídia não encontrado.")

        capsule = Capsule.query.options(joinedload(Capsule.mood)).filter_by(id=media_file.capsule_id, user_id=current_user_from_token.id).first()
        if not capsule:
            abort(403, description="Acesso negado: Você não é o proprietário deste recurso.")
        file_path = os.path.join(UPLOAD_DIR, media_file.stored_filename)
        if not os.path.exists(file_path):
            print(f"WARNING: Arquivo físico não encontrado para mídia ID {media_id} em {file_path}")
            abort(404, description="Arquivo físico não encontrado no servidor.")
        return send_file(file_path, mimetype=media_file.mime_type, as_attachment=False)
    except Exception as e:
        print(f"Erro inesperado ao buscar arquivo de mídia ID {media_id}: {e}")
        return jsonify({'message': f'Erro interno do servidor ao buscar arquivo: {str(e)}'}), 500

@app.route('/api/media/delete/<int:media_id>', methods=['DELETE'])
@token_required
def delete_single_media(current_user_from_token, media_id):
    try:
        media_file = MediaFile.query.get(media_id)
        if not media_file:
            return jsonify({'message': 'Arquivo de mídia não encontrado'}), 404

        capsule = Capsule.query.filter_by(id=media_file.capsule_id, user_id=current_user_from_token.id).first()
        if not capsule:
            return jsonify({'message': 'Acesso negado: Você não é o proprietário desta mídia'}), 403

        file_path_to_delete = os.path.join(UPLOAD_DIR, media_file.stored_filename)
        if os.path.exists(file_path_to_delete):
            try:
                os.remove(file_path_to_delete)
                print(f"Deleted physical media file: {file_path_to_delete}")
            except Exception as e:
                print(f"Error deleting physical file {file_path_to_delete}: {e}")
        else:
            print(f"Warning: Physical file not found for media ID {media_id} at {file_path_to_delete} (DB record will be removed).")

        db.session.delete(media_file)
        db.session.commit()

        return jsonify({'message': 'Mídia excluída com sucesso'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting media file {media_id}: {e}")
        return jsonify({'message': f'Erro ao excluir mídia: {str(e)}'}), 500

@app.route('/api/checkout-session/<session_id>', methods=['GET'])
def get_checkout_session(session_id):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        customer_email = session.customer_email
        return jsonify({'email': customer_email})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Configure sua chave secreta Stripe
stripe.api_key = 'sk_test_51RsZpYGmed08xBS1Z9Zf1oXSH0Gzse0wbzKyU9YmuoJrTH9Mu3fF6SSLuoOI3CR6p9K8queWXzy9wZUzm9oEPSvc00OB6mKTvi'

@app.route('/criar-assinatura', methods=['POST'])
def criar_assinatura():
    data = request.get_json()

    email = data.get('email', '').strip()
    plano = data.get('plano', 'mensal')  # padrão mensal

    # Definimos trial fixo em 3 dias para o fluxo que combinamos
    trial_days = 3

    price_ids = {
        'mensal': 'price_1RsZuIGmed08xBS1pbgvXdV4',
        'anual': 'price_1RsZxWGmed08xBS1QeFw3USO',
    }

    if plano not in price_ids:
        return jsonify({'error': 'Plano inválido. Use "mensal" ou "anual".'}), 400

    try:
        session_params = {
            'mode': 'subscription',
            'line_items': [{
                'price': price_ids[plano],
                'quantity': 1,
            }],
            'success_url': 'https://app.capsuladigital.com.br/sucesso?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url': 'https://app.capsuladigital.com.br/cancelado',
            'subscription_data': {'trial_period_days': trial_days}
        }

        # Só passa o email se for diferente de vazio e do placeholder
        if email and email.lower() != 'usuario@email.com':
            session_params['customer_email'] = email

        session = stripe.checkout.Session.create(**session_params)

        return jsonify({'checkout_url': session.url})

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api', methods=['GET'])
def api_info():
    return jsonify({
        'message': 'Capsula API - Live Intensely, Preserve Forever', 'version': '1.0.0',
        'mode': 'integrated', 'endpoints': [
            'POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me (requer autenticação)',
            'GET /api/tags (requer autenticação)', 'GET /api/moods (requer autenticação)',
            'GET /api/capsules (requer autenticação)', 'POST /api/capsules (requer autenticação)',
            'GET /api/capsules/<id> (requer autenticação)',
            'PUT /api/capsules/<id> (requer autenticação) - NOVO: Editar cápsula',
            'DELETE /api/capsules/<id> (requer autenticação) - NOVO: Excluir cápsula',
            'GET /api/capsules/stats [DEPRECATED: Use /api/analytics]',
            'GET /api/analytics (requer autenticação) - NOVO: Obter dados de analytics avançados',
            'POST /api/media/upload (requer autenticação)', 'GET /api/media/<id> (requer autenticação e permissão)',
            'DELETE /api/media/delete/<id> (requer autenticação e permissão) - NOVO: Excluir mídia específica',
            'PUT /api/users/profile (requer autenticação) - NOVO: Atualizar nome e email do usuário',
            'PUT /api/users/password (requer autenticação) - NOVO: Alterar senha do usuário',
            'DELETE /api/users/me (requer autenticação) - NOVO: Excluir a conta do usuário'
        ]
    })

@app.route('/favicon.ico')
def favicon():
    try:
        return send_from_directory(FRONTEND_DIST_PATH, 'favicon.ico', mimetype='image/x-icon')
    except FileNotFoundError:
        print(f"WARNING: favicon.ico not found in FRONTEND_DIST_PATH.")
        abort(404)
    except Exception as e:
        print(f"ERROR: Failed to serve favicon.ico: {e}")
        return jsonify({'message': 'Erro interno ao servir favicon'}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    print(f"--- DEBUG serve_react_app ---")
    print(f"Original Request path received by Flask: '{path}'")
    print(f"Type of path: {type(path)}")
    print(f"Length of path: {len(path)}")
    print(f"Path content (hex): {path.encode('utf-8').hex()}")

    if path.startswith('static/'):
        print(f"Path *CONFIRMED* to start with 'static/'. Entering static block.")
        print(f"Trying to serve from STATIC_ROOT_PATH: '{STATIC_ROOT_PATH}'")
        file_name_in_static = path.replace('static/', '', 1)
        full_static_file_path = os.path.join(STATIC_ROOT_PATH, file_name_in_static)
        print(f"Calculated full static file path: '{full_static_file_path}'")
        print(f"Does full_static_file_path exist? {os.path.exists(full_static_file_path)}")
        print(f"Is full_static_file_path a file? {os.path.isfile(full_static_file_path)}")

        if os.path.exists(full_static_file_path) and os.path.isfile(full_static_file_path):
            print(f"File found in STATIC_ROOT_PATH. Serving: '{file_name_in_static}' from '{STATIC_ROOT_PATH}'")
            try:
                mimetype_to_send = None
                if file_name_in_static.lower().endswith('.png'):
                    mimetype_to_send = 'image/png'
                elif file_name_in_static.lower().endswith(('.jpg', '.jpeg')):
                    mimetype_to_send = 'image/jpeg'
                elif file_name_in_static.lower().endswith('.gif'):
                    mimetype_to_send = 'image/gif'
                response = send_from_directory(STATIC_ROOT_PATH, file_name_in_static, mimetype=mimetype_to_send)
                print(f"Successfully sent from directory. Response status: {response.status_code}")
                print(f"Flask Response Content-Type Header (static block): {response.headers.get('Content-Type')}")
                return response
            except Exception as e:
                print(f"ERROR: send_from_directory failed for static file: {e}")
        else:
            print(f"FILE NOT FOUND IN STATIC_ROOT_PATH for path: '{path}'")
            print(f"  os.path.exists('{full_static_file_path}'): {os.path.exists(full_static_file_path)}")
            print(f"  os.path.isfile('{full_static_file_path}'): {os.path.isfile(full_static_file_path)}")

    else:
        print(f"Path does NOT start with 'static/'. Proceeding to frontend/dist or fallback.")
        print(f"Trying FRONTEND_DIST_PATH: '{FRONTEND_DIST_PATH}'")
        full_path_to_file_in_dist = os.path.join(FRONTEND_DIST_PATH, path)
        print(f"Full path to file in dist: '{full_path_to_file_in_dist}'")
        if path != "" and os.path.exists(full_path_to_file_in_dist) and os.path.isfile(full_path_to_file_in_dist):
            print(f"File found in FRONTEND_DIST_PATH. Serving: '{path}' from '{FRONTEND_DIST_PATH}'")
            try:
                mimetype_to_send = None
                if path.lower().endswith('.js'):
                    mimetype_to_send = 'application/javascript'
                elif path.lower().endswith('.css'):
                    mimetype_to_send = 'text/css'
                elif path.lower().endswith('.webmanifest'):
                    mimetype_to_send = 'application/manifest+json'
                elif path.lower().endswith('.svg'):
                    mimetype_to_send = 'image/svg+xml'
                elif path.lower().endswith('.png'):
                    mimetype_to_send = 'image/png'
                elif path.lower().endswith(('.jpg', '.jpeg')):
                    mimetype_to_send = 'image/jpeg'
                elif path.lower().endswith('.gif'):
                    mimetype_to_send = 'image/gif'

                response = send_from_directory(FRONTEND_DIST_PATH, path, mimetype=mimetype_to_send)
                print(f"Successfully sent from directory. Response status: {response.status_code}")
                print(f"Flask Response Content-Type Header (dist block): {response.headers.get('Content-Type')}")
                return response
            except Exception as e:
                print(f"ERROR: send_from_directory failed for dist file: {e}")
        else:
            print(f"File NOT found or is not a file in FRONTEND_DIST_PATH for path: '{path}'.")
            print(f"  os.path.exists('{full_path_to_file_in_dist}'): {os.path.exists(full_path_to_file_in_dist)}")
            print(f"  os.path.isfile('{full_path_to_file_in_dist}'): {os.path.isfile(full_path_to_file_in_dist)}")

    print(f"Serving index.html as fallback for path: '{path}'")
    return send_from_directory(FRONTEND_DIST_PATH, 'index.html')

if __name__ == '__main__':
    print("🚀 Capsula API Integrada pronta para ser executada (modo local).")
    print("📊 Modo: Frontend + Backend integrados")
    print("📁 Frontend: Servindo React do diretório dist/")
    print("🔗 Endpoints API disponíveis:")
    print("   POST /api/auth/register")
    print("   POST /api/auth/login")
    print("   GET  /api/auth/me")
    print("   GET  /api/tags")
    print("   GET  /api/moods")
    print("   GET  /api/capsules")
    print("   POST /api/capsules")
    print("   GET  /api/capsules/<id>")
    print("   PUT  /api/capsules/<id>")
    print("   DELETE /api/capsules/<id>")
    print("   GET  /api/capsules/stats [DEPRECATED]")
    print("   GET  /api/analytics [NOVO]")
    print("   POST /api/media/upload")
    print("   GET  /api/media/<id> (requer autenticação e permissão)")
    print("   DELETE /api/media/delete/<id> (requer autenticação e permissão)")
    print("   PUT  /api/users/profile (requer autenticação)")
    print("   PUT  /api/users/password (requer autenticação)")
    print("   DELETE /api/users/me (requer autenticação)")
    print("")
    print("🚀 Iniciando o servidor Flask localmente...")
    app.run(debug=True, host='0.0.0.0', port=5001)
