import { ArrowUpRight, Activity, Users, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { patients, studies, users } from "@/lib/data";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const recentStudies = studies
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || "Unknown Patient";
  }

  const getRequesterName = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return "Unknown Doctor";
      return users.find(u => u.id === patient.requesterId)?.name || "Unknown Doctor";
  }


  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">+2 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studies.length}</div>
            <p className="text-xs text-muted-foreground">+10 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studies.filter(s => s.isUrgent).length}</div>
            <p className="text-xs text-muted-foreground">+1 in the last 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Studies</CardTitle>
            <CardDescription>An overview of the most recent studies uploaded.</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/studies">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Requester</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentStudies.map(study => (
                <TableRow key={study.id}>
                  <TableCell>
                    <div className="font-medium">{getPatientName(study.patientId)}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{getRequesterName(study.patientId)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(parseISO(study.date), "PPP")}
                  </TableCell>
                  <TableCell className="text-right">
                    {study.isUrgent ? (
                      <Badge variant="destructive">Urgent</Badge>
                    ) : (
                      <Badge variant="outline">Routine</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
