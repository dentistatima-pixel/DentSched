import { USE_FIREBASE } from '../config';
import { MockDataService } from './mockDataService';
import { FirebaseDataService } from './firebaseDataService';

export const DataService = USE_FIREBASE ? FirebaseDataService : MockDataService;