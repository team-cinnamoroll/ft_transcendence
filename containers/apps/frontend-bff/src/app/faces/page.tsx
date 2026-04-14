import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";
import FacesClient from "@/components/face/FacesClient";

const FacesPage = () => {
  const currentUser = userRepository.getCurrentUser();
  const myFaces = faceRepository.listByUserId(currentUser.id);

  return <FacesClient initialFaces={myFaces} />;
};

export default FacesPage;
