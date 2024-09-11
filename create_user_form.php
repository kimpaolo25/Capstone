<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create User Account</title>
    <link rel="stylesheet" href="./css/style.css">
</head>
<body>
    <div class="container">
        <h2>Create User Account</h2>
        <form action="create_user_action.php" method="POST" id="createUserForm">
            <div class="input-wrapper">
                <input type="text" name="username" id="username" class="input-field" required>
                <label for="username" class="label">Username</label>
            </div>

            <div class="input-wrapper">
                <input type="password" name="password" id="password" class="input-field" required>
                <label for="password" class="label">Password</label>
            </div>

            <div class="input-wrapper">
                <input type="password" name="confirm_password" id="confirm_password" class="input-field" required>
                <label for="confirm_password" class="label">Confirm Password</label>
            </div>

            <div class="input-wrapper">
                <input type="submit" class="input-login" value="Create Account">
            </div>

            <div id="error" style="color: red;"></div>
        </form>
    </div>

    <script>
        document.getElementById('createUserForm').addEventListener('submit', function (e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            if (password !== confirmPassword) {
                e.preventDefault();
                document.getElementById('error').textContent = 'Passwords do not match.';
            }
        });
    </script>
</body>
</html>
