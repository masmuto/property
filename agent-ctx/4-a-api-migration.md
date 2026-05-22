# Task 4-a: Migrate API Routes from Prisma to Supabase JS Client

## Agent: API Migration Specialist

## Summary
Rewrote all 4 API route files to use the Supabase JS client (`getServerClient` from `@/lib/supabase`) instead of Prisma (`db` from `@/lib/db`). The API interface (request/response format) remains identical so frontend components require no changes.

## Files Modified

### 1. `/home/z/my-project/src/app/api/properties/route.ts`
- **GET**: Replaced `db.property.findMany()` with `supabase.from('properties').select('*')`. Uses `.or()` with `.ilike()` for multi-column search. Lead counts fetched via a separate query to `leads` table with `.in('property_id', ids)`.
- **POST**: Replaced `db.property.create()` with `supabase.from('properties').insert().select().single()`. Maps camelCase input to snake_case for insert.
- Fallback data preserved on error for GET.

### 2. `/home/z/my-project/src/app/api/properties/[id]/route.ts`
- **GET**: Uses `.select('*').eq('id', id).single()`. Lead count via `.select('*', { count: 'exact', head: true }).eq('property_id', id)`.
- **PUT**: Existence check via `.select('id').eq('id', id).single()`, then `.update().eq('id', id).select().single()`. Maps camelCase fields to snake_case in update data.
- **DELETE**: Deletes related leads first via `.delete().eq('property_id', id)`, then deletes property via `.delete().eq('id', id)`.
- Fallback data preserved on error for GET.

### 3. `/home/z/my-project/src/app/api/leads/route.ts`
- **GET**: Uses `.select('*, properties(*)')` for Supabase join. Maps `properties` (Supabase auto-join key) to `property` (frontend expects singular).
- **POST**: Validates property existence if `propertyId` provided via `.select('*').eq('id', propertyId).single()`. Inserts with snake_case column names.
- Returns empty array with `_fallback: true` on error for GET.

### 4. `/home/z/my-project/src/app/api/leads/[id]/route.ts`
- **PUT**: Existence check, then `.update().eq('id', id).select('*, properties(*)').single()`. Maps join result to camelCase.
- **DELETE**: Existence check, then `.delete().eq('id', id)`.

## Key Design Decisions

1. **Mapping functions**: Each file includes `propertyToCamel()` and `leadToCamel()` helper functions to convert snake_case DB rows to camelCase API responses.

2. **Lead counts**: For `_count: { leads: N }`, a separate query counts leads per property since Supabase doesn't support Prisma-style `_count` includes natively.

3. **Supabase joins**: For lead-property relations, Supabase's `select('*, properties(*)')` syntax auto-joins. The result key `properties` is mapped to `property` (singular) in the API response.

4. **Error handling**: All Supabase `error` objects are checked. Fallback data is returned on GET failures to keep the app functional during Supabase setup.

5. **Search**: For the multi-column OR search on properties, used Supabase's `.or('title.ilike.%search%,location.ilike.%search%,...')` syntax.

## Lint: Passes clean ✓
## Dev server: Running without errors ✓
