<?php

namespace Tests\Unit\Library;

use Activity_audit;
use ReflectionClass;
use Tests\TestCase;

class ActivityAuditTest extends TestCase
{
    public function test_build_field_changes_marks_sensitive_fields_without_values(): void
    {
        $audit = $this->newAuditWithoutConstructor();

        $before = [
            'status' => 'Booked',
            'notes' => 'Sensitive',
            'id_users_customer' => 10,
        ];

        $after = [
            'status' => 'Completed',
            'notes' => 'Sensitive after change',
            'id_users_customer' => 10,
        ];

        $changes = $audit->build_field_changes($before, $after);

        $this->assertSame('Booked', $changes['status']['before']);
        $this->assertSame('Completed', $changes['status']['after']);
        $this->assertTrue($changes['notes']['changed']);
        $this->assertTrue($changes['notes']['sensitive']);
        $this->assertArrayNotHasKey('before', $changes['notes']);
        $this->assertArrayNotHasKey('after', $changes['notes']);
    }

    public function test_redact_metadata_redacts_nested_sensitive_keys(): void
    {
        $audit = $this->newAuditWithoutConstructor();
        $ref = new ReflectionClass(Activity_audit::class);
        $method = $ref->getMethod('redact_metadata');
        $method->setAccessible(true);

        $input = [
            'status' => 'paid',
            'email' => 'example@example.com',
            'nested' => [
                'note' => 'private text',
                'safe' => 'ok',
            ],
        ];

        $output = $method->invoke($audit, $input);

        $this->assertSame('[REDACTED]', $output['email']);
        $this->assertSame('[REDACTED]', $output['nested']['note']);
        $this->assertSame('ok', $output['nested']['safe']);
    }

    private function newAuditWithoutConstructor(): Activity_audit
    {
        $ref = new ReflectionClass(Activity_audit::class);

        /** @var Activity_audit $audit */
        $audit = $ref->newInstanceWithoutConstructor();

        return $audit;
    }
}
