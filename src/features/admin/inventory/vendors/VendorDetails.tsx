"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Edit, Mail, Phone, MapPin, User } from "lucide-react";
import { IVendor } from "../types/inventory-types";
import { useState } from "react";
import EditVendor from "./EditVendor";
import { useRouter } from "next/navigation";

interface VendorDetailsProps {
  vendor: IVendor;
}

export default function VendorDetails({ vendor }: VendorDetailsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{vendor.name}</CardTitle>
              <CardDescription>Vendor Information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vendor.isActive ? "default" : "secondary"}>
                {vendor.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor.contactPerson && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                  <p className="text-sm">{vendor.contactPerson}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm">{vendor.phone}</p>
              </div>
            </div>

            {vendor.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{vendor.email}</p>
                </div>
              </div>
            )}

            {vendor.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{vendor.address}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {new Date(vendor.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(vendor.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditVendor
        vendor={vendor}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
