import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/core/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { htmlContent } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Dynamic import of puppeteer
    let puppeteer: any;
    try {
      // @ts-ignore - puppeteer will be installed via npm
      puppeteer = await import("puppeteer");
    } catch (importError) {
      console.error("Puppeteer not installed:", importError);
      return NextResponse.json(
        { error: "PDF generation service is not available." },
        { status: 503 }
      );
    }

    // Launch browser
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for network to be idle
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      // Half of A4 portrait — top tear-off slip
      const pdfBuffer = await page.pdf({
        width: "210mm",
        height: "148.5mm",
        margin: {
          top: "5mm",
          right: "8mm",
          bottom: "5mm",
          left: "8mm",
        },
        printBackground: true,
      });

      // Return PDF as response
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=invoice.pdf",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
