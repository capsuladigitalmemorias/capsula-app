# update_admin_credentials.py
import sys
import os

# Adicione o caminho para a RAIZ do seu projeto ao sys.path.
# Isso é crucial para que as importações internas funcionem.
sys.path.insert(0, '/home/Wilder/capsula')

# 1. IMPORTE app, db E User TUDO DE 'backend.src.main'.
#    No seu 'main.py', 'app', 'db' e a classe 'User' são definidos globalmente.
#    Ao importar assim, você garante que está usando AS MESMAS instâncias.
try:
    from backend.src.main import app, db, User # <--- ALTERAÇÃO CRÍTICA AQUI!
except ImportError as e:
    print(f"❌ Erro ao importar app, db ou User de backend.src.main: {e}")
    print("Verifique se 'app', 'db' e a classe 'User' são definidos globalmente em backend/src/main.py")
    sys.exit(1)

# 2. Gerenciamento do contexto da aplicação Flask.
#    A criação do contexto é fundamental para que o SQLAlchemy saiba qual app usar.
#    Utilizamos push/pop explícitos em um bloco try-finally para garantir a limpeza.
ctx = app.app_context()
ctx.push() # Empilha o contexto da aplicação para que as operações de DB funcionem.

try:
    # 3. DEFINA AS CREDENCIAIS AQUI:
    old_admin_email = 'admin@capsula.com'             # <<< O EMAIL ATUAL DO ADMIN
    new_admin_email = 'contato@capsuladigital.com.br' # <<< O NOVO EMAIL QUE VOCÊ QUER PARA O ADMIN
    new_password = '@Adtr19#'                           # <<< A NOVA SENHA QUE VOCÊ QUER PARA O ADMIN

    # Encontra o usuário admin no banco de dados.
    # User.query agora deve usar a instância 'db' corretamente registrada com 'app'.
    user = User.query.filter_by(email=old_admin_email).first()

    if user:
        # Se encontrou o usuário, atualiza o email (se diferente) e a senha.
        if user.email != new_admin_email:
            user.email = new_admin_email
        user.set_password(new_password) # Assume que User tem um método set_password para hashing.

        # Salva as alterações no banco de dados.
        db.session.commit()
        print(f"✅ Credenciais do admin atualizadas com sucesso!")
        print(f"   Email antigo (buscado): '{old_admin_email}'")
        print(f"   Novo Email:   '{new_admin_email}'")
        print(f"   Nova Senha:   '{new_password}'") # Mostra a senha que você digitou.
    else:
        # Se o usuário admin não foi encontrado, informa e tenta criar um novo.
        print(f"❌ Usuário admin com email '{old_admin_email}' não encontrado.")
        print("Certifique-se de que o 'old_admin_email' está correto.")
        print("\nTentando criar um novo admin com as credenciais fornecidas...")
        new_user = User(email=new_admin_email, name='Administrador', is_admin=True)
        new_user.set_password(new_password) # Define a senha com hash.
        db.session.add(new_user) # Adiciona o novo usuário à sessão.
        db.session.commit() # Salva o novo usuário no banco de dados.
        print(f"✅ Novo usuário admin criado: {new_admin_email} / {new_password}")

except Exception as e:
    # Em caso de qualquer erro, desfaz as operações pendentes no banco de dados.
    # Garante que 'db' esteja disponível para o rollback.
    if 'db' in locals() and db: # Verifica se 'db' foi definido e não é None
        db.session.rollback()
    print(f"Ocorreu um erro: {e}")
finally:
    # Garante que a sessão do banco de dados seja removida/fechada, liberando recursos.
    # Isso é crucial para evitar sessões abertas no banco de dados.
    if 'db' in locals() and db: # Verifica se 'db' foi definido e não é None
        db.session.remove()
    ctx.pop() # Desempilha o contexto da aplicação, liberando recursos.
