import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import ReportViewer from "@/components/dashboard/ReportViewer";
import Link from "next/link";
import { useRouter } from "next/router";

const AnalyticsPage = () => {
  const router = useRouter();
  
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Analytics and insights for your practice</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            {/* <CardTitle className="text-xl font-semibold">Analytics Overview</CardTitle> */}
          </CardHeader>
          <CardContent className="pt-0">
            <ReportViewer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
