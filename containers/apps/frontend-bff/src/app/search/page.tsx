import { activityRepository } from "@/repositories/activity-repository";
import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";
import { subscriptionRepository } from "@/repositories/subscription-repository";
import SearchClient from "@/components/search/SearchClient";

export default function SearchPage() {
  const currentUser = userRepository.getCurrentUser();

  return (
    <SearchClient
      allActivities={activityRepository.listAll()}
      allFaces={faceRepository.listAll()}
      allUsers={userRepository.listAll()}
      currentUserId={currentUser.id}
      subscribedFaceIds={subscriptionRepository.getSubscribedFaceIds()}
    />
  );
}
