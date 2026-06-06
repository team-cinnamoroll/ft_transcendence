import FacesClient from '@/components/face/FacesClient';
import { getViewerContext } from '@/server/usecases/viewer';
import { listActivitiesByUserId } from '@/server/usecases/activities';

const FacesPage = async () => {
  const { currentUser, myFaces } = await getViewerContext();
  const activities = await listActivitiesByUserId(currentUser.id);
  return <FacesClient initialFaces={myFaces} activities={activities} />;
};

export default FacesPage;
