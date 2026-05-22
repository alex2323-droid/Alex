import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { Client } from '../hooks/useClients';
import { Order } from '../hooks/useOrders';

interface OrderInsightsProps {
  clients: Client[];
  orders: Order[];
}

export function OrderInsights({ clients, orders }: OrderInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const dataSummary = {
        totalClients: clients.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.price, 0),
        recentOrders: orders.slice(0, 5).map(o => ({
          name: o.name,
          price: o.price,
          status: o.status
        }))
      };

      const prompt = `Actúa como un consultor de negocios experto. Analiza los siguientes datos de un sistema de gestión de pedidos y proporciona 3 consejos accionables para mejorar el negocio. Sé breve y profesional.
      
      Datos:
      - Clientes totales: ${dataSummary.totalClients}
      - Pedidos totales: ${dataSummary.totalOrders}
      - Pedidos pendientes: ${dataSummary.pendingOrders}
      - Pedidos completados: ${dataSummary.completedOrders}
      - Ingresos totales (completados): $${dataSummary.totalRevenue}
      
      Pedidos recientes: ${JSON.stringify(dataSummary.recentOrders)}
      
      Responde en español.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      setInsight(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      console.error('Error generating insight:', error);
      setInsight("Error al conectar con la inteligencia artificial.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          IA Business Insights
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateInsight} 
          disabled={loading || orders.length === 0}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {insight ? 'Actualizar' : 'Generar Análisis'}
        </Button>
      </CardHeader>
      <CardContent>
        {insight ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-line text-sm leading-relaxed">{insight}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {orders.length === 0 
              ? "Registra algunos pedidos para obtener consejos de la IA." 
              : "Haz clic en el botón para que la IA analice tu negocio."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
