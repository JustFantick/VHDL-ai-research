library ieee;
use ieee.std_logic_1164.all;

entity tb_vhdl_moore_fsm_sequence_detector is
end tb_vhdl_moore_fsm_sequence_detector;

architecture behavior of tb_vhdl_moore_fsm_sequence_detector is
    component vhdl_moore_fsm_sequence_detector is
        port (
            clock : in std_logic;
            reset : in std_logic;
            sequence_in : in std_logic;
            detector_out : out std_logic
        );
    end component;

    signal clock : std_logic := '0';
    signal reset : std_logic := '0';
    signal sequence_in : std_logic := '0';
    signal detector_out : std_logic;

    constant clock_period : time := 10 ns;
begin
    uut : vhdl_moore_fsm_sequence_detector port map (
        clock => clock,
        reset => reset,
        sequence_in => sequence_in,
        detector_out => detector_out
    );

    clock_process : process
    begin
        clock <= '0';
        wait for clock_period / 2;
        clock <= '1';
        wait for clock_period / 2;
    end process;

    stim_proc : process
    begin
        -- Initialize inputs
        sequence_in <= '0';
        reset <= '1';
        wait for 30 ns; -- Hold reset
        
        -- Synchronize with clock falling edge to avoid race conditions
        wait until falling_edge(clock);
        reset <= '0';
        
        -- Sequence: 1
        wait until falling_edge(clock);
        sequence_in <= '1';
        wait until falling_edge(clock);
        -- Sequence: 10
        sequence_in <= '0';
        wait until falling_edge(clock);
        -- Sequence: 101 (not target)
        sequence_in <= '1';
        
        -- Reset and try target sequence: 1001
        wait until falling_edge(clock);
        sequence_in <= '0'; -- Reset sequence state or just continue
        
        -- Start target sequence 1-0-0-1
        wait until falling_edge(clock);
        sequence_in <= '1'; -- 1
        wait until falling_edge(clock);
        sequence_in <= '0'; -- 0
        wait until falling_edge(clock);
        sequence_in <= '0'; -- 0
        wait until falling_edge(clock);
        sequence_in <= '1'; -- 1 (Match expected here)
        
        wait until rising_edge(clock);
        -- Check output after it settles
        wait for 1 ns; 
        assert detector_out = '1' report "Error: Sequence 1001 not detected" severity error;

        wait until falling_edge(clock);
        sequence_in <= '0';
        
        wait;
    end process;
end behavior;
