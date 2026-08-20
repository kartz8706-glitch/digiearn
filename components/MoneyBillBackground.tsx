const bills = Array.from({ length: 14 }, (_, index) => index);
const streams = Array.from({ length: 8 }, (_, index) => index);
const ticks = Array.from({ length: 18 }, (_, index) => index);
const nodes = Array.from({ length: 10 }, (_, index) => index);

export default function MoneyBillBackground() {
  return (
    <div className="money-flow" aria-hidden="true">
      <span className="market-grid" />
      <span className="market-sweep" />
      <span className="signal-ring signal-ring-primary" />
      <span className="signal-ring signal-ring-secondary" />
      {streams.map((stream) => (
        <span key={stream} className="data-stream" />
      ))}
      <span className="ticker-ribbon">
        {ticks.map((tick) => (
          <span key={tick} className="ticker-pulse" />
        ))}
      </span>
      {nodes.map((node) => (
        <span key={node} className="signal-node" />
      ))}
      {bills.map((bill) => (
        <span key={bill} className="money-bill" />
      ))}
    </div>
  );
}
