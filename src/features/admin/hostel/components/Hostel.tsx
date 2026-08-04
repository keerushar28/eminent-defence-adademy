"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/core/components/tabs";
import AllocationManagement from "../allocations/components/AllocationManagement";

export default function Hostel() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
        <TabsTrigger value="beds">Beds</TabsTrigger>
        <TabsTrigger value="allocations">Allocations</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>

      <TabsContent value="allocations" className="mt-4">
        <AllocationManagement />
      </TabsContent>
    </Tabs>
  );
}