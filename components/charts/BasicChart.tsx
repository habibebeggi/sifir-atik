"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BasicChartProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;  
}

export function BasicChart({ title, value, icon: Icon, iconColor = "text-green-500" }: BasicChartProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;

  return (
    <div className="space-y-4 justify-start">
      <Card className="flex flex-col max-w-sm mx-auto text-slate-900">
        <CardHeader className="text-center text-xl mt-4">
          <div className="flex items-center justify-center">
            <CardTitle className="font-extrabold text-slate-900">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-1/3">
              <Icon className={`h-24 w-24 mb-2 ${iconColor}`} />
            </div>
            <div className="w-2/3 pl-4 pr-2 flex flex-col justify-center">
              <div className="flex justify-between mb-2 items-center">
                <p className="text-lg font-medium text-gray-800">{title}:</p>
                <p className="text-lg font-medium">{formattedValue}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mb-5"></CardFooter>
      </Card>
    </div>
  );
}
