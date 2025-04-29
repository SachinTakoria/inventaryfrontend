import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PieChartProps {
  stats: any;
  purchaseSummary: any;
}

const PieChartDemo = ({ stats, purchaseSummary }: PieChartProps) => {
  const data = [
    { name: "Today's Sale", value: stats?.todaySale || 0 },
    { name: "Today's Purchase", value: purchaseSummary?.todayTotal || 0 },
    { name: "Today's Bills", value: stats?.todayBills || 0 },
    { name: "Total Bills", value: stats?.totalOrders || 0 },
  ];

  const COLORS = ["#6366f1", "#34d399", "#facc15", "#f87171"]; // MNC level colors ✅

  return (
    <div className="bg-white shadow-md rounded-xl p-6 w-full">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        🥇 Sales & Purchase Distribution
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartDemo;
