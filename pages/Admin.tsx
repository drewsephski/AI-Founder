import React from 'react';

const Admin: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-4 text-lg text-secondary-foreground/80">
          Welcome, Admin. Manage users, tools, and system settings here.
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-card-foreground">System Status</h2>
        <p className="mt-4 text-secondary-foreground/70">
          All systems are operational. This area is a placeholder for future admin-specific components like user management tables, tool configuration forms, and analytics dashboards.
        </p>
      </div>
    </div>
  );
};

export default Admin;