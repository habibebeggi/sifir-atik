"use client";

import CollectedChart from "@/components/charts/CollectedChart";
import ProfileChart from "@/components/charts/ProfileChart";
import BalanceChart from "@/components/charts/BalanceChart";
import ReportsTable from "@/components/tables/ReportsTable";
import CollectedWastesTable from "@/components/tables/CollectedWasteTable";
import ReportedChart from "@/components/charts/ReportedChart";

export default function DashboardPage() {
  return (
    <div>
      <div>
        <h1 className="text-3xl text-center font-semibold mb-6  text-gray-800">
          Kullanıcı Bilgileri
        </h1>
        <section className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <ProfileChart />
          <BalanceChart />
          <ReportedChart/>
          <CollectedChart />

        </section>

        <div className="w-full lg:w-[95%] xl:w-[90%] mx-auto mb-8">
          <div className="overflow-x-auto w-full mt-4 px-0">
            <ReportsTable />
          </div>

          <div className="overflow-x-auto w-full mt-4 px-0">
            <CollectedWastesTable />
          </div>
        </div>
      </div>
    </div>
  );
}
