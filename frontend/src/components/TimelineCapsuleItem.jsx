// frontend/src/components/TimelineCapsuleItem.jsx
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TimelineCapsuleItem = ({ capsule, onOpenModal }) => {
  return (
    <div className="timeline-capsule-item" onClick={() => onOpenModal(capsule)}>
      <div className="timeline-dot"></div>
      <div className="timeline-content">
        <p className="capsule-date">🗓️ {format(new Date(capsule.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
        <h5 className="capsule-title">{capsule.title}</h5>
        {capsule.thumbnail_url && (
          <div className="capsule-thumbnail">
            <img src={capsule.thumbnail_url} alt={capsule.title} />
          </div>
        )}
      </div>

      {/* ESTILOS ESPECÍFICOS DA CÁPSULA (TimelineCapsuleItem.jsx) */}
      <style jsx>{`
        .timeline-capsule-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 30px;
          position: relative;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          box-sizing: border-box;
          max-width: 560px; /* Largura máxima para desktop */
        }

        .timeline-capsule-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }

        /* Estilos de posicionamento para desktop (itens pares/ímpares) */
        .timeline-capsule-item:nth-child(odd) {
          flex-direction: row-reverse;
          margin-left: calc(50% + 20px);
        }
        .timeline-capsule-item:nth-child(even) {
          flex-direction: row;
          margin-right: calc(50% + 20px);
        }

        .timeline-dot {
          width: 14px;
          height: 14px;
          background: #4299e1;
          border-radius: 50%;
          position: absolute;
          top: 15px;
          z-index: 2;
        }
        .timeline-capsule-item:nth-child(odd) .timeline-dot {
          left: -27px;
          transform: translateX(-50%);
        }
        .timeline-capsule-item:nth-child(even) .timeline-dot {
          right: -27px;
          transform: translateX(50%);
        }
        .timeline-capsule-item::after {
            content: '';
            position: absolute;
            top: 21px;
            width: 20px;
            height: 2px;
            background: #4299e1;
            z-index: 1;
        }
        .timeline-capsule-item:nth-child(odd)::after {
            left: -20px;
        }
        .timeline-capsule-item:nth-child(even)::after {
            right: -20px;
        }

        .timeline-content {
          flex-grow: 1;
          padding: 0 15px;
        }
        .timeline-capsule-item:nth-child(odd) .timeline-content {
            text-align: left;
        }
        .timeline-capsule-item:nth-child(even) .timeline-content {
            text-align: right;
        }

        .capsule-date {
          font-size: 0.85rem;
          color: #718096;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .capsule-title {
          font-size: 1.1rem;
          color: #2d3748;
          margin-top: 0;
          margin-bottom: 10px;
          font-weight: 600;
          overflow-wrap: break-word;
        }

        .capsule-thumbnail {
          width: 100%;
          max-width: 150px;
          height: auto;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 10px;
          border: 1px solid #ebf8ff;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .capsule-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .image-loading-placeholder {
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f4f8;
            color: #718096;
            font-size: 0.9rem;
        }

        /* Responsividade para mobile (até 768px de largura) */
        @media (max-width: 768px) {
          .timeline-capsule-item {
            flex-direction: row !important;
            margin-left: 40px !important;
            margin-right: 0 !important;
            max-width: calc(100% - 50px);
            box-sizing: border-box;
            overflow-wrap: break-word;
            word-wrap: break-word;
          }

          .timeline-capsule-item:nth-child(odd),
          .timeline-capsule-item:nth-child(even) {
              margin-left: 40px !important;
              margin-right: 0 !important;
              flex-direction: row !important;
          }

          .timeline-capsule-item .timeline-dot {
            left: -27px;
            transform: translateX(-50%);
          }
          .timeline-capsule-item::after {
            left: -20px;
          }

          .timeline-content {
            text-align: left !important;
            padding-left: 0;
            padding-right: 0;
          }

          .capsule-thumbnail {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TimelineCapsuleItem;