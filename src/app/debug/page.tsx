"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DebugPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const testAPIs = async () => {
        setLoading(true);
        setError("");
        console.log("🔍 Starting API tests...");

        try {
            // Test Users API
            console.log("Testing /api/users...");
            const usersResponse = await fetch('/api/users');
            console.log("Users response status:", usersResponse.status);
            
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                console.log("Users data:", usersData);
                setUsers(usersData);
            } else {
                throw new Error(`Users API failed: ${usersResponse.status}`);
            }

            // Test Patients API
            console.log("Testing /api/patients...");
            const patientsResponse = await fetch('/api/patients');
            console.log("Patients response status:", patientsResponse.status);
            
            if (patientsResponse.ok) {
                const patientsData = await patientsResponse.json();
                console.log("Patients data:", patientsData);
                setPatients(patientsData);
            } else {
                throw new Error(`Patients API failed: ${patientsResponse.status}`);
            }

        } catch (err) {
            console.error("API test error:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        testAPIs();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Debug Page</h1>
            
            <div className="flex gap-4">
                <Button onClick={testAPIs} disabled={loading}>
                    {loading ? "Testing..." : "Test APIs"}
                </Button>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Users/Doctors ({users.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {users.map(user => (
                                <div key={user.id} className="p-2 border rounded">
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-gray-600">Role: {user.role}</p>
                                    <p className="text-sm text-gray-600">Email: {user.email}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Patients ({patients.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {patients.map(patient => (
                                <div key={patient.id} className="p-2 border rounded">
                                    <p className="font-medium">{patient.name}</p>
                                    <p className="text-sm text-gray-600">Age: {patient.age}</p>
                                    <p className="text-sm text-gray-600">Gender: {patient.gender}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Console Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600">
                        Open browser console (F12) to see detailed logs from API tests.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}