export const dynamic = "force-dynamic";

import Users from "@/features/super-admin/users/components/Users";
import { fetchAllUsers } from "./actions/user-actions";

export default async function AdminPage() {
    const result = await fetchAllUsers()
    if (!result.success) {
        return <div>Error</div>
    }
    return <Users usersData={result.data} />
}