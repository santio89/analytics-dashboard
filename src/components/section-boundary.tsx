"use client";

import { Component, type ReactNode } from "react";
import { SectionError } from "@/components/section-error";

type SectionBoundaryProps = {
  name: string;
  children: ReactNode;
};

type SectionBoundaryState = {
  error: Error | null;
};

export class SectionBoundary extends Component<
  SectionBoundaryProps,
  SectionBoundaryState
> {
  state: SectionBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <SectionError
          message={`${this.props.name} hit a problem. Other sections should still work.`}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
