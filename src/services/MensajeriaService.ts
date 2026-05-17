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
}

/**
 * Patrón Singleton — MensajeriaService.
 *
 * Garantiza que exista una única instancia de la conexión a RabbitMQ
 * durante todo el ciclo de vida de la aplicación. Esto evita abrir
 * múltiples conexiones al broker, lo que podría causar pérdida de
 * mensajes o agotamiento de recursos.
 *
 * Uso:
 *   const servicio = MensajeriaService.getInstance();
 *   await servicio.publicar(EVENTOS.REPORTE_CREADO, payload);
 */
export class MensajeriaService {
  private static instancia: MensajeriaService;

  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly exchange: string;
  private readonly url: string;

  // Constructor privado — impide instanciación directa con new
  private constructor() {
    this.url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
    this.exchange = process.env.RABBITMQ_EXCHANGE ?? 'sanos_y_salvos_events';
  }

  /**
   * Retorna la única instancia de MensajeriaService.
   * La crea si aún no existe.
   */
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

// Exportar la instancia única para uso en toda la aplicación
export const mensajeriaService = MensajeriaService.getInstance();
