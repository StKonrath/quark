<?php
namespace Quark\ViewResources\ChartJS\Charts;

use Quark\ViewResources\ChartJS\IQuarkChartJSChart;

use Quark\ViewResources\ChartJS\ChartJSMultipleChartBehavior;

/**
 * Class LineChart
 *
 * @package Quark\ViewResources\ChartJS\Charts
 */
class LineChart implements IQuarkChartJSChart {
	use ChartJSMultipleChartBehavior;

	/**
	 * @return string
	 */
	public function ChartJSType () {
		return 'Line';
	}
}