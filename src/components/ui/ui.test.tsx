import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';
import { Button } from './button';
import { EmptyState } from './empty-state';

test('button renders its label', () => {
  render(<Button variant="primary">Upload</Button>);
  expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
});

test('badge tones map to token classes', () => {
  render(<Badge tone="success">Contract revision</Badge>);
  expect(screen.getByText('Contract revision').className).toContain('success');
});

test('empty state shows title and description', () => {
  render(<EmptyState title="No matching contracts found" description="Try a different keyword." />);
  expect(screen.getByText('No matching contracts found')).toBeInTheDocument();
});
