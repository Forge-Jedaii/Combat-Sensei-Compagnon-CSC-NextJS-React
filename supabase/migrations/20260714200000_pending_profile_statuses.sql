alter type public.profile_status add value if not exists 'pending' before 'active';
alter type public.profile_status add value if not exists 'rejected' before 'deleted';
