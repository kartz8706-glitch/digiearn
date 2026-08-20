import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

const activities = [
  { name: "Amina K.", type: "Deposit", amount: "UGX 480,000" },
  { name: "Daniel O.", type: "Withdrawal", amount: "UGX 120,000" },
  { name: "Grace N.", type: "Deposit", amount: "UGX 1,250,000" },
  { name: "Musa T.", type: "Deposit", amount: "UGX 350,000" },
  { name: "Sarah B.", type: "Withdrawal", amount: "UGX 210,000" },
  { name: "Ivan L.", type: "Deposit", amount: "UGX 760,000" },
  { name: "Nadia P.", type: "Withdrawal", amount: "UGX 95,000" },
  { name: "Brian M.", type: "Deposit", amount: "UGX 2,000,000" },
];

export default function UserActivityMarquee() {
  const loopedActivities = [...activities, ...activities];

  return (
    <div className="user-activity-marquee" aria-label="Recent user activity">
      <div className="user-activity-track">
        {loopedActivities.map((activity, index) => {
          const isDeposit = activity.type === "Deposit";
          const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;

          return (
            <span key={`${activity.name}-${index}`} className="user-activity-item">
              <span className={isDeposit ? "activity-icon activity-deposit" : "activity-icon activity-withdrawal"}>
                <Icon size={13} />
              </span>
              <span className="activity-name">{activity.name}</span>
              <span className={isDeposit ? "activity-type activity-type-deposit" : "activity-type activity-type-withdrawal"}>
                {activity.type}
              </span>
              <span className="activity-amount">{activity.amount}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
