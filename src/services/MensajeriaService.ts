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
  especie: string;
  color: string;
  tamanio: string;
  ubicacionLatitud: number;
  ubicacionLongitud: number;
  direccionReferencia?: string;
  codigoChip?: string;
  fechaPublicacion: string;
  usuarioId: string;
  fotoUrl?: string;
  descripcion?: string;  // ← nuevo
}

/**
 * Patrón Singleton — MensajeriaService.
 */
export class MensajeriaService {
  private static instancia: MensajeriaService;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly exchange: string;
  private readonly url: string;
  private reconectando = false;

  private constructor() {
    this.url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
    this.exchange = process.env.RABBITMQ_EXCHANGE ?? 'sanos_y_salvos_events';
  }

  public static getInstance(): MensajeriaService {
    if (!MensajeriaService.instancia) {
      MensajeriaService.instancia = new MensajeriaService();
    }
    return MensajeriaService.instancia;
  }

  async conectar(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      console.log('[RabbitMQ] Conexión establecida con exchange:', this.exchange);

      this.connection.on('error', () => this.reconectar());
      this.connection.on('close', () => this.reconectar());
    } catch (error) {
      console.error('[RabbitMQ] Error al conectar:', error);
      setTimeout(() => this.reconectar(), 5000);
    }
  }

  private async reconectar(): Promise<void> {
    if (this.reconectando) return;
    this.reconectando = true;
    this.channel = null;
    this.connection = null;
    console.warn('[RabbitMQ] Conexión perdida, reconectando en 5s...');
    await new Promise((r) => setTimeout(r, 5000));
    this.reconectando = false;
    await this.conectar();
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
      this.channel = null;
    }
  }

  async cerrar(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

export const mensajeriaService = MensajeriaService.getInstance();
