import { activityRepository } from './activity.repository.js';

export const activityService = {
  async list(userId, query) {
    return activityRepository.list(userId, query);
  },
};
