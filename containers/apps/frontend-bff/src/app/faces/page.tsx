import FacesClient from '@/components/face/FacesClient';
import { getViewerContext } from '@/server/usecases/viewer';

const FacesPage = async () => {
  const { myFaces } = await getViewerContext();
  return <FacesClient initialFaces={myFaces} />;
};

export default FacesPage;
