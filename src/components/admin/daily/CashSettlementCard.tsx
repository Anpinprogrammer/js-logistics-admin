import { useState } from 'react'
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

const dailyCashSettlementData = [
  { 
    id: '1',
    name: 'Caja', 
    initialAmount: '200000',
    moneyIn: '60000',
    moneyOut: '50000',
    balance: '210000'
  },
  {
    id: '2',
    name: 'Bancolombia', 
    initialAmount: '200000',
    moneyIn: '60000',
    moneyOut: '50000',
    balance: '210000'},
  {
    id: '3',
    name: 'Nequi', 
    initialAmount: '200000',
    moneyIn: '60000',
    moneyOut: '50000',
    balance: '210000'
  }
]


const CashSettlementCard = () => {

  const [isSettled, setIsSettled] = useState(false)

    const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <>
    {/* Couriers Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Cuadre caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-center">Base</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Salidas</TableHead>
                  <TableHead className="text-center">Balance</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyCashSettlementData.map(({ id, name, initialAmount, moneyIn, moneyOut, balance }) => (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(initialAmount))}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(Number(moneyIn))}</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(Number(moneyOut))}</TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      Number(balance) >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(Number(balance))}
                    </TableCell>
                    <TableCell className="text-center">
                      {isSettled ? (
                        <Badge variant="default" className="bg-success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Cuadrado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {!isSettled && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Cerrar Cuadre
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {dailyCashSettlementData.map(({ id, name, initialAmount, moneyIn, moneyOut, balance }) => (
              <div key={id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{name}</span>
                  {isSettled ? (
                    <Badge variant="default" className="bg-success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Cuadrado
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Base</span>
                    <span>{formatCurrency(Number(initialAmount))}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Ingresos</span>
                    <span className="text-success">{formatCurrency(Number(moneyIn))}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Salidas</span>
                    <span className="text-primary">{formatCurrency(Number(moneyOut))}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Balance</span>
                    <span className={cn("font-semibold", Number(balance) >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(Number(balance))}
                    </span>
                  </div>
                </div>
                {!isSettled && (
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full"
                    onClick={() => {
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Cerrar Cuadre
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default CashSettlementCard