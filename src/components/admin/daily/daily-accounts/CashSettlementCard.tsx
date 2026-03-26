import { useState, useEffect } from 'react'
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Truck, CheckCircle2, AlertCircle, Wallet, Pencil, X, Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { CompanyDailyResponse, useUpdateOpeningBalance, useFetchTransactions } from '@/hooks/useDailyCompanyOperations';
import { WritableStreamDefaultWriter } from 'node:stream/web';
import DetailsCompanyAccounts from './DetailsCompanyAccounts';
import { ACCOUNT_LABELS } from '@/utils';
  

interface CashSettlementCardProps {
  dailyCashSettlementData: CompanyDailyResponse
}


const CashSettlementCard = ({ dailyCashSettlementData }) => {

  const fetchTransactions = useFetchTransactions()




  const [isSettled, setIsSettled] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [ detailsDialog, setDetailsDialog ] = useState(false)
  const [ accountInfo, setAccountInfo ] = useState({
    account: '',
    opening_balance: '',
    total_income: '',
    total_expense: '',
    balance: ''
  })
  const [ transactions, setTransactions ] = useState([])

  const updateOpeningBalance = useUpdateOpeningBalance();

  useEffect(() => {
    const fetchAccount = async () => {
      if(accountInfo?.account) {
        try {
          const result = await fetchTransactions.mutateAsync({
            account: accountInfo.account
          })
          setTransactions(result)
        } catch (error) {
          console.log(error)
        }
      }
    }
    fetchAccount()
  }, [accountInfo])

  const handleEditStart = (account: string, currentValue: string) => {
    setEditingAccount(account)
    setEditValue(currentValue)
  }

  const handleEditCancel = () => {
    setEditingAccount(null)
    setEditValue('')
  }

  const handleEditConfirm = async (account: string) => {
    // TODO: persist the new opening_balance value for `account`
    await updateOpeningBalance.mutateAsync({
      account,
      newAmount: editValue
    })
    setEditingAccount(null)
    setEditValue('')
  }

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
                {dailyCashSettlementData?.map(({ account, opening_balance, total_income, total_expense, balance }) => (
                  <TableRow key={account}>
                    <TableCell className="font-medium">{ACCOUNT_LABELS[account] || account}</TableCell>
                    <TableCell className="text-right">
                      {editingAccount === account ? (
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 w-32 text-right"
                            autoFocus
                          />
                          <button onClick={handleEditCancel} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditConfirm(account)} className="text-muted-foreground hover:text-success transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          {formatCurrency(Number(opening_balance))}
                          {Number(opening_balance) !== 0 && (
                            <button
                              onClick={() => handleEditStart(account, opening_balance)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(Number(total_income))}</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(Number(total_expense))}</TableCell>
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
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAccountInfo({ account, opening_balance, total_income, total_expense, balance })
                            setDetailsDialog(true);
                            /**
                             * 
                             
                            const summary = courierSummaries.find(s => s.courier.user_id === courier.user_id);
                            setDetailsCourier(summary);
                            
                            */
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>

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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {dailyCashSettlementData?.map(({ account, opening_balance, total_income, total_expense, balance }) => (
              <div key={account} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{ACCOUNT_LABELS[account] || account}</span>
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
                    <span>{formatCurrency(Number(opening_balance))}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Ingresos</span>
                    <span className="text-success">{formatCurrency(Number(total_income))}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Salidas</span>
                    <span className="text-primary">{formatCurrency(Number(total_expense))}</span>
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

      <DetailsCompanyAccounts 
        detailsDialog={detailsDialog}
        setDetailsDialog={setDetailsDialog}
        accountInfo={accountInfo}
        transactions={transactions}
      />
    </>
  )
}

export default CashSettlementCard