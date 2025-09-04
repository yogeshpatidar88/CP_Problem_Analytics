
    for handle in user_handles:
        fetch_and_insert_user_submissions(cursor, db, handle, count=5)
        