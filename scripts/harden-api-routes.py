import os

target_dir = r"c:\Users\USER\Desktop\convenant hostel management system\convenant-hostel\src\app\api"
line_to_add = 'export const dynamic = "force-dynamic";\n'

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file == "route.js":
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if 'export const dynamic = "force-dynamic"' not in content:
                print(f"Updating {file_path}")
                # We want to add it early, maybe after the first few imports
                lines = content.splitlines()
                # Find a good spot, e.g. after any imports
                last_import_idx = 0
                for i, line in enumerate(lines):
                    if line.startswith("import "):
                        last_import_idx = i + 1
                
                lines.insert(last_import_idx, '\n' + line_to_add)
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write('\n'.join(lines) + '\n')
            else:
                print(f"Skipping {file_path} (already has it)")
