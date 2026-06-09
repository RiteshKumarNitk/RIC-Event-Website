"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/30">
            <CardHeader className="text-center">
              <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit mb-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">
                {this.props.fallbackTitle || "Something went wrong"}
              </CardTitle>
              <CardDescription>
                {this.props.fallbackDescription ||
                  "A component failed to load. This may be a temporary issue."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={this.handleRetry} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
