from django.db import migrations, models
import string
import random

def generate_njangi_code():
    return 'NJANGI-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def populate_invite_codes(apps, schema_editor):
    NjangiGroup = apps.get_model('groups', 'NjangiGroup')
    for group in NjangiGroup.objects.all():
        if not group.invite_code:
            code = generate_njangi_code()
            while NjangiGroup.objects.filter(invite_code=code).exists():
                code = generate_njangi_code()
            group.invite_code = code
            group.save()

class Migration(migrations.Migration):

    dependencies = [
        ('groups', '0005_membership_cycle_start_index_membership_role_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='njangigroup',
            name='invite_code',
            # No db_index here — AlterField below adds unique=True which implies an index.
            # Having both causes a DuplicateTable error in PostgreSQL.
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.RunPython(populate_invite_codes),
        migrations.AlterField(
            model_name='njangigroup',
            name='invite_code',
            field=models.CharField(blank=True, max_length=20, unique=True, default=''),
            preserve_default=False,
        ),
    ]
