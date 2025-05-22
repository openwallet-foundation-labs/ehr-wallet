// __mocks__/@/components/ui/chart.tsx
import React from 'react';

export const BarChart: React.FC<any> = ({ data }) => <div data-testid="mock-bar-chart">{JSON.stringify(data)}</div>;
export const LineChart: React.FC<any> = ({ data }) => <div data-testid="mock-line-chart">{JSON.stringify(data)}</div>;
export const PieChart: React.FC<any> = ({ data }) => <div data-testid="mock-pie-chart">{JSON.stringify(data)}</div>;
