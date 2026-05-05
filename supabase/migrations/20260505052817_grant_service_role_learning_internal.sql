-- Allow server-side learning RPCs to record activity through the internal helper.

grant execute on function public.record_activity_internal(uuid, integer, integer) to service_role;
