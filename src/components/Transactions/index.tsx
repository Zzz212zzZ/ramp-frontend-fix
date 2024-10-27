import { useCallback } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams, Transaction } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const { fetchWithoutCache, loading, cache } = useCustomFetch()

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })

      // Update the cached transactions to reflect the new approval status
      if (cache?.current) {
        // Get all cache keys related to transactions
        const cacheKeys = Array.from(cache.current.keys()).filter((key) =>
        key.startsWith("paginatedTransactions") || key.startsWith("transactionsByEmployee")
      )

      for (const cacheKey of cacheKeys) {
        const cacheResponse = cache.current.get(cacheKey)
        if (cacheResponse) {
          const data = JSON.parse(cacheResponse)

          // Check if data is an array (for transactionsByEmployee) or an object with 'data' field (for paginatedTransactions)
          if (Array.isArray(data)) {
            // Update the transaction in the array
            const updatedData = data.map((transaction) =>
              transaction.id === transactionId ? { ...transaction, approved: newValue } : transaction
            )

            // Update the cache
            cache.current.set(cacheKey, JSON.stringify(updatedData))
          } else if (data && data.data && Array.isArray(data.data)) {
            // For paginatedTransactions
            const updatedData = data.data.map((transaction: Transaction) =>
              transaction.id === transactionId ? { ...transaction, approved: newValue } : transaction
            )

            // Update the cache with the new data
            cache.current.set(cacheKey, JSON.stringify({ ...data, data: updatedData }))
          }
        }
      }
    }
  },
  [fetchWithoutCache, cache]
  )

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
