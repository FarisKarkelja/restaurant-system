<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/analytics/AnalyticsStrategyInterface.php';
require_once __DIR__ . '/../../backend/analytics/AnalyticsContext.php';
require_once __DIR__ . '/../../backend/analytics/PeakHoursStrategy.php';
require_once __DIR__ . '/../../backend/analytics/PopularItemsStrategy.php';
require_once __DIR__ . '/../../backend/analytics/AverageOrderValueStrategy.php';
require_once __DIR__ . '/../../backend/analytics/RevenueTrendStrategy.php';

class AnalyticsStrategyTest extends TestCase
{
    /** @return array<array{class-string}> */
    public static function strategyProvider(): array
    {
        return [
            [PeakHoursStrategy::class],
            [PopularItemsStrategy::class],
            [AverageOrderValueStrategy::class],
            [RevenueTrendStrategy::class],
        ];
    }

    #[DataProvider('strategyProvider')]
    public function testStrategyImplementsInterface(string $class): void
    {
        $stub = $this->createMock($class);

        $this->assertInstanceOf(
            AnalyticsStrategyInterface::class,
            $stub,
            "$class must implement AnalyticsStrategyInterface"
        );
    }

    public function testContextDelegatesToActiveStrategy(): void
    {
        $expected = [['hour' => 12, 'order_count' => 42]];

        $strategy = $this->createMock(AnalyticsStrategyInterface::class);
        $strategy->expects($this->once())
                 ->method('calculate')
                 ->willReturn($expected);

        $db      = $this->createMock(PDO::class);
        $context = new AnalyticsContext($strategy);

        $this->assertSame($expected, $context->run($db));
    }

    public function testContextCanSwapStrategyAtRuntime(): void
    {
        $first = $this->createMock(AnalyticsStrategyInterface::class);
        $first->expects($this->never())->method('calculate');

        $second = $this->createMock(AnalyticsStrategyInterface::class);
        $second->expects($this->once())->method('calculate')->willReturn([]);

        $db      = $this->createMock(PDO::class);
        $context = new AnalyticsContext($first);
        $context->setStrategy($second);
        $context->run($db);
    }

    public function testContextForwardsParamsToStrategy(): void
    {
        $params = ['days' => 7, 'limit' => 5];

        $strategy = $this->createMock(AnalyticsStrategyInterface::class);
        $strategy->expects($this->once())
                 ->method('calculate')
                 ->with($this->anything(), $params)
                 ->willReturn([]);

        $db      = $this->createMock(PDO::class);
        $context = new AnalyticsContext($strategy);
        $context->run($db, $params);
    }
}
