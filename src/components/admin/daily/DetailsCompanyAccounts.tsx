import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyTransactions } from '@/hooks/useDailyCompanyOperations';

interface DetailsCompanyAccountsProps {
    detailsDialog: boolean;
    setDetailsDialog: React.Dispatch<React.SetStateAction<boolean>>
    detailsCourier?: {
        courier: {
            full_name: string
        };
        baseAmount: number;
        totalCollected: number;
        partialsSum: number;
        expectedBalance: number;
        deliveries: [];
        partials: [];

    };
    accountInfo: {
        account: string;
        opening_balance: string;
        total_income: string;
        total_expense: string;
        balance: string;
    };
    transactions: DailyTransactions[]
}

const ACCOUNT_LABELS: Record<string, string> = {
  cash: 'Caja',
  bancolombia: 'Bancolombia',
  nequi: 'Nequi',
};

const DetailsCompanyAccounts = ({ detailsDialog, setDetailsDialog, detailsCourier, accountInfo, transactions }: DetailsCompanyAccountsProps) => {

  const [ openings, setOpenings ] = useState([])
  const [ incomes, setIncomes ] = useState([])
  const [ expenses, setExpenses ] = useState([])

  useEffect(() => {
    const sortTransactions = () => {
      if(transactions.length > 0){
        setOpenings(
          transactions.filter(
            t => 
              t.type === 'opening_balance'
          )
        )
        setIncomes(
          transactions.filter(
            t => 
              t.type === 'income'
          )
        )
        setExpenses(
          transactions.filter(
            t => 
              t.type === 'expense'
          )
        )
      }
    }
    sortTransactions()
  }, [transactions])
  

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalle del día — {ACCOUNT_LABELS[accountInfo?.account]}
            </DialogTitle>
            <DialogDescription>
              Todas las transacciones registradas hoy
            </DialogDescription>
          </DialogHeader>

          {accountInfo?.account && (
            <div className="space-y-6 py-2">
              {/* Summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Saldo inicial</p>
                  <p className="font-semibold">{formatCurrency(Number(accountInfo.opening_balance))}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Total Ingresos</p>
                  <p className="font-semibold text-success">{formatCurrency(Number(accountInfo.total_income))}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Total Egresos</p>
                  <p className="font-semibold text-destructive">{formatCurrency(Number(accountInfo.total_expense))}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground text-xs mb-1">Balance</p>
                  <p className={cn("font-semibold", Number(accountInfo.balance) >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(Number(accountInfo.balance))}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="opening">
                <TabsList className="w-full">
                  <TabsTrigger value="opening" className="flex-1 gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    Saldo inicial
                  </TabsTrigger>
                  <TabsTrigger value="incomes" className="flex-1 gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Ingresos
                  </TabsTrigger>
                  <TabsTrigger value="expenses" className="flex-1 gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Egresos 
                  </TabsTrigger>
                </TabsList>

                {/* Opening balance tab */}
                <TabsContent value="opening" className="mt-4">
                  {openings.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">Sin planete inicial registrado</p>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Wallet className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Base asignada</p>
                          <p className="text-muted-foreground text-xs">Saldo inicial del día</p>
                        </div>
                      </div>
                      { openings.map( o => (
                        <p className="font-semibold text-base">{formatCurrency(Number(o.amount))}</p>
                      ))
                      }
                      
                    </div>
                  )}
                </TabsContent>
                

                {/* Incomes tab */}
                <TabsContent value="incomes" className="mt-4">
                  {incomes.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">Sin ingresos registrados</p>
                  ) : (
                    <div className="space-y-2">
                      {incomes.map((i: any) => (
                        <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100">
                              <ArrowUpCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-green-600">{formatCurrency(Number(i.amount))}</p>
                              {i.notes && <p className="text-muted-foreground text-xs mt-0.5">{i.notes}</p>}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {new Date(i.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                    )}
                </TabsContent>
                    {/** 
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Destinatario</TableHead>
                            <TableHead className="text-right">A cobrar</TableHead>
                            <TableHead className="text-right">Recibido</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Notas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incomes.map((i: any) => (
                            <TableRow key={i.id}>
                              <TableCell className="font-medium">
                                {i.account}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(Number(i.amount) || 0)}
                              </TableCell>
                              <TableCell className="text-right text-success">
                                {i.amount != null ? formatCurrency(Number(i.amount)) : '—'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {i.account === 'cash' && 'Efectivo'}
                                {i.account === 'transfer_to_courier' && 'Transfer. mensajero'}
                                {i.account === 'transfer_to_client' && 'Transfer. cliente'}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">
                                {i.notes || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    */}
                  
                

                {/* Expenses tab */}
                <TabsContent value="expenses" className="mt-4">
                  {expenses.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">Sin egresos registrados</p>
                  ) : (
                    <div className="space-y-2">
                      {expenses.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border text-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-destructive/10">
                              <ArrowDownCircle className="w-4 h-4 text-destructive" />
                            </div>
                            <div>
                              <p className="font-medium text-destructive">{formatCurrency(Number(e.amount))}</p>
                              {e.notes && <p className="text-muted-foreground text-xs mt-0.5">{e.notes}</p>}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {new Date(e.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
  )
}

export default DetailsCompanyAccounts