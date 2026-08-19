import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const transactions: {
  type: string;
  asset: string;
  amount: string;
  date: string;
}[] = [];

export default function TransactionsPage() {
  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen pt-24 md:ml-64 px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">Transactions</h1>

          <div className="mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813]">
            {transactions.length === 0 && (
              <p className="p-8 text-sm text-gray-500">No transactions yet.</p>
            )}
            {transactions.map((transaction) => (
              <div
                key={`${transaction.date}-${transaction.asset}`}
                className="flex items-center justify-between border-b border-[#1c3026] p-5 last:border-0"
              >
                <div>
                  <p className="font-medium">{transaction.asset}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {transaction.type} · {transaction.date}
                  </p>
                </div>

                <p
                  className={
                    transaction.type === "SELL"
                      ? "text-red-400"
                      : "text-[#43e58c]"
                  }
                >
                  {transaction.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}