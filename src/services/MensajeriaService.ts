import amqp, { Channel, ChannelModel } from 'amqplib';

export const EVENTOS = {
  REPORTE_CREADO: 'mascota.reporte.creado',
  REPORTE_ACTUALIZADO: 'mascota.reporte.actualizado',
  REPORTE_ESTADO_CAMBIADO: 'mascota.reporte.estado_cambiado',
  REPORTE_ELIMINADO: 'mascota.reporte.eliminado',
} as const;

export interface EventoReporteCreado {
  reporteId: string;
  tipo: string;
  nombreMascota: string;
  raza: string;
  color: string;
  tamanio: string;
  ubicacionLatitud: number;
  ubicacionLongitud: number;
  direccionReferencia?: string;
  fechaPublicacion: string;
  usuarioId: string;
}

export class MensajeriaService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly exchange: string;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
    this.exchange = process.env.RABBITMQ_EXCHANGE ?? 'sanos_y_salvos_events';
  }

  async conectar(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      console.log('[RabbitMQ] Conexión establecida con exchange:', this.exchange);
    } catch (error) {
      console.error('[RabbitMQ] Error al conectar:', error);
    }
  }

  async publicar(routingKey: string, payload: object): Promise<void> {
    if (!this.channel) {
      console.warn('[RabbitMQ] Canal no disponible, evento descartado:', routingKey);
      return;
    }
    try {
      const mensaje = Buffer.from(JSON.stringify(payload));
      this.channel.publish(this.exchange, routingKey, mensaje, { persistent: true });
      console.log(`[RabbitMQ] Evento publicado → ${routingKey}`);
    } catch (error) {
      console.error('[RabbitMQ] Error al publicar evento:', error);
    }
  }

  async cerrar(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

export const mensajeriaService = new MensajeriaService();
