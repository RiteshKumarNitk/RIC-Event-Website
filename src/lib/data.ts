// This file is now deprecated as all event data is managed in Firestore.
// The EventsProvider in 'src/app/admin/events/events-provider.tsx' handles
// fetching data and seeding the database with initial sample events if the 
// 'events' collection is empty. This file is kept only for historical
// reference of the data types.

import type { Event } from "./types";

export const events: Event[] = [];
