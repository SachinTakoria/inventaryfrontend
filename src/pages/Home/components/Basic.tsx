import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

interface BasicChartProps {
  stats: any;
  purchaseSummary: any;
}

const BasicChart = ({ stats, purchaseSummary }: BasicChartProps) => {
  const data = [
    { name: "Today's Sale", value: stats?.todaySale || 0 },
    { name: "Today's Bills", value: stats?.todayBills || 0 },
    { name: "Total Bills", value: stats?.totalOrders || 0 },
    { name: "Today's Purchase", value: purchaseSummary?.todayTotal || 0 }, // ✅ Added purchase
  ];

  return (
    <div className="bg-white shadow-md rounded-xl p-6 w-full">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        📊 Overview
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#6366f1" barSize={50} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BasicChart;
