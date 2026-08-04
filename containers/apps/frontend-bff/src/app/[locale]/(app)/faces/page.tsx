import FacesClient from '@/components/face/FacesClient';
import { getViewerContext } from '@/server/usecases/viewer';
import { listSeedsByUserId } from '@/server/usecases/seeds';
import { getAuthSession } from '@/server/usecases/auth';

const FacesPage = async () => {
  const { currentUser, linkableCurrentUser, myFaces } = await getViewerContext();
  const [seeds, session] = await Promise.all([listSeedsByUserId(currentUser.id), getAuthSession()]);
  return (
    <FacesClient
      initialFaces={myFaces}
      seeds={seeds}
      currentUserId={session?.userId ?? currentUser.id}
      currentUser={linkableCurrentUser}
    />
  );
};

export default FacesPage;
