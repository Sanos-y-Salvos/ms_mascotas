import amqp from 'amqplib';
import { AppDataSource } from '../config/database';
import { Reporte, EstadoReporte } from '../entities/Reporte';

const EXCHANGE = process.env.RABBITMQ_EXCHANGE ?? 'sanos_y_salvos_events';
const QUEUE    = 'mascotas.matching-aceptado';
const ROUTING  = 'matching.match.aceptado';

export async function iniciarConsumidor(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

  const conectarYConsumir = async (): Promise<void> => {
    try {
      const conn    = await amqp.connect(url);
      const channel = await conn.createChannel();

      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      const { queue } = await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(queue, EXCHANGE, ROUTING);

      conn.on('error', () => setTimeout(conectarYConsumir, 5000));
      conn.on('close', () => setTimeout(conectarYConsumir, 5000));

      channel.consume(queue, async (msg) => {
        if (!msg) return;
        try {
          const { reporteAId, reporteBId } = JSON.parse(msg.content.toString());
          if (reporteAId && reporteBId) {
            const repo = AppDataSource.getRepository(Reporte);
            await Promise.all([
              repo.update(reporteAId, { estado: EstadoReporte.EMPAREJADO }),
              repo.update(reporteBId, { estado: EstadoReporte.EMPAREJADO }),
            ]);
            console.log(`[Consumidor] Reportes ${reporteAId} y ${reporteBId} → EMPAREJADO`);
          }
          channel.ack(msg);
        } catch (err) {
          console.error('[Consumidor] Error al procesar evento:', err);
          channel.nack(msg, false, false);
        }
      });

      console.log(`[Consumidor] Activo, escuchando ${ROUTING}`);
    } catch {
      console.error('[Consumidor] Sin conexión RabbitMQ, reintentando en 5s...');
      setTimeout(conectarYConsumir, 5000);
    }
  };

  await conectarYConsumir();
}
