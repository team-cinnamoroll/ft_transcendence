import FacesClient from '@/components/face/FacesClient';
import { getViewerContext } from '@/server/usecases/viewer';
import { listSeedsByUserId } from '@/server/usecases/seeds';

const FacesPage = async () => {
  const { currentUser, myFaces } = await getViewerContext();
  const seeds = await listSeedsByUserId(currentUser.id);
  return (
    <FacesClient
      initialFaces={myFaces}
      seeds={seeds}
      currentUserId={currentUser.id}
      currentUser={currentUser}
    />
  );
};

export default FacesPage;
