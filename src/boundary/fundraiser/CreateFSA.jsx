/** Create a new FSA. Validates and redirects to the manage page on success. */
import { Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../common/PageHeader.jsx';
import FSAForm from './FSAForm.jsx';
import { FSAController } from '../../control/FSAController.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function CreateFSA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (values) => {
    try {
      await FSAController.create({ ...values, fundraiserId: user.id });
      toast.success('Fundraising activity created');
      navigate('/fundraiser/manage');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Fundraising Activity"
        subtitle="Tell donees what you're raising funds for and how they can help"
      />
      <Card>
        <CardContent>
          <FSAForm submitLabel="Create FSA" onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
        </CardContent>
      </Card>
    </>
  );
}
