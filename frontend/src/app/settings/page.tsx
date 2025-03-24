"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Database } from "lucide-react";
import apiService from "@/services/api";
import MainLayout from "@/components/layout/MainLayout";

export default function SettingsPage() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [migrationMessage, setMigrationMessage] = useState<string>('');

  const runObjectivesMigration = async () => {
    if (migrationStatus === 'loading') return;
    
    try {
      setMigrationStatus('loading');
      setMigrationMessage('');
      
      const result = await apiService.migrations.fixObjectiveClientIds();
      
      setMigrationStatus('success');
      setMigrationMessage(`${result.message} (${result.count} objectives updated)`);
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      setMigrationMessage('Failed to run migration. Check console for details.');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              System configuration and maintenance
            </p>
          </div>
        </div>

        <Separator />
        
        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Maintenance
            </CardTitle>
            <CardDescription>
              Database management and system utilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Database Migrations</h3>
              
              <div className="p-4 border rounded-md space-y-4">
                <div>
                  <h4 className="font-medium">Fix Objective Client Associations</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    This migration assigns client IDs to all existing security objectives without client association.
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={runObjectivesMigration} 
                    disabled={migrationStatus === 'loading'}
                  >
                    {migrationStatus === 'loading' ? 'Running Migration...' : 'Run Migration'}
                  </Button>
                </div>
                
                {migrationStatus === 'success' && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Migration Successful</AlertTitle>
                    <AlertDescription>{migrationMessage}</AlertDescription>
                  </Alert>
                )}
                
                {migrationStatus === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Migration Failed</AlertTitle>
                    <AlertDescription>{migrationMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 