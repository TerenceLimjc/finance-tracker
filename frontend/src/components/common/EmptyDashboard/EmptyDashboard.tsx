import { Button, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * EmptyDashboard
 *
 * Shown when no transactions have been uploaded yet.
 * Renders an Ant Design Empty component with a CTA button
 * that navigates to the Uploads page.
 */
export function EmptyDashboard() {
  const navigate = useNavigate();

  return (
    <Empty
      description="No transactions yet"
      style={{ marginTop: 120 }}
    >
      <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
        Upload a bank statement to get started
      </p>
      <Button type="primary" onClick={() => navigate('/uploads')}>
        Go to Uploads
      </Button>
    </Empty>
  );
}
